const API_BASE = import.meta.env.PROD ? '' : 'http://localhost:3000';

// 生成访客 ID
export function getVisitorId(): string {
  let visitorId = localStorage.getItem('cnjy_visitor_id');
  if (!visitorId) {
    visitorId = 'v_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
    localStorage.setItem('cnjy_visitor_id', visitorId);
  }
  return visitorId;
}

// 检查是否在微信内
export function isWechat(): boolean {
  return /micromessenger/i.test(navigator.userAgent);
}

// 检查是否是移动端
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 检查是否已支付（本地缓存）
export function checkLocalPayment(type: 'basic' | 'ai'): boolean {
  const key = type === 'basic' ? 'cnjy_paid_basic' : 'cnjy_paid_ai';
  return localStorage.getItem(key) === 'true';
}

// 标记已支付（本地缓存）
export function markLocalPayment(type: 'basic' | 'ai'): void {
  const key = type === 'basic' ? 'cnjy_paid_basic' : 'cnjy_paid_ai';
  localStorage.setItem(key, 'true');
}

// 创建 Native 支付（PC 扫码）
export async function createNativePayment(amount: number, description: string): Promise<{
  orderNo: string;
  codeUrl: string;
  qrImageUrl: string;
}> {
  const visitorId = getVisitorId();

  const response = await fetch(`${API_BASE}/api/payment?action=create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, amount, description }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '创建支付订单失败');
  }

  // 生成二维码图片 URL
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.data.codeUrl)}`;

  return {
    orderNo: result.data.orderNo,
    codeUrl: result.data.codeUrl,
    qrImageUrl,
  };
}

// 创建 JSAPI 支付（微信内）
export async function createJsapiPayment(code: string, amount: number, description: string): Promise<{
  orderNo: string;
  payParams: any;
}> {
  const visitorId = getVisitorId();

  const response = await fetch(`${API_BASE}/api/payment?action=jsapi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorId, code, amount, description }),
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '创建支付订单失败');
  }

  return {
    orderNo: result.data.orderNo,
    payParams: result.data,
  };
}

// 获取微信授权 URL
export async function getWechatOAuthUrl(redirectUrl: string): Promise<string> {
  const response = await fetch(`${API_BASE}/api/payment?action=oauth&redirect=${encodeURIComponent(redirectUrl)}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '获取授权链接失败');
  }

  return result.data.url;
}

// 查询支付状态
export async function queryPaymentStatus(orderNo: string): Promise<{
  paid: boolean;
  status?: string;
  message?: string;
}> {
  const response = await fetch(`${API_BASE}/api/payment?action=query&orderNo=${orderNo}`);
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || '查询支付状态失败');
  }

  return result.data;
}

// 调起微信 JSAPI 支付
export function invokeWechatPay(payParams: any): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof WeixinJSBridge === 'undefined') {
      reject(new Error('请在微信内打开'));
      return;
    }

    WeixinJSBridge.invoke('getBrandWCPayRequest', {
      appId: payParams.appId,
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
    }, (res: any) => {
      if (res.err_msg === 'get_brand_wcpay_request:ok') {
        resolve(true);
      } else if (res.err_msg === 'get_brand_wcpay_request:cancel') {
        resolve(false);
      } else {
        reject(new Error(res.err_msg || '支付失败'));
      }
    });
  });
}

// 轮询支付状态
export function pollPaymentStatus(
  orderNo: string,
  onSuccess: () => void,
  onTimeout: () => void,
  interval = 2000,
  timeout = 5 * 60 * 1000
): () => void {
  const startTime = Date.now();
  let timer: number | null = null;

  const poll = async () => {
    try {
      const result = await queryPaymentStatus(orderNo);
      if (result.paid) {
        onSuccess();
        return;
      }
    } catch (e) {
      console.error('查询支付状态失败:', e);
    }

    if (Date.now() - startTime > timeout) {
      onTimeout();
      return;
    }

    timer = window.setTimeout(poll, interval);
  };

  poll();

  // 返回取消函数
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
  };
}

// 声明微信 JS Bridge 类型
declare global {
  interface Window {
    WeixinJSBridge: any;
  }
  const WeixinJSBridge: any;
}
