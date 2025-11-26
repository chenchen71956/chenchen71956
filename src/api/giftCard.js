import request from './request';

export function checkGiftCard(code) {
  return request({
    url: '/gift-card/check',
    method: 'post',
    data: { code }
  });
}

export function redeemGiftCard(code) {
  return request({
    url: '/gift-card/redeem',
    method: 'post',
    data: { code }
  });
}

export function getGiftCardHistory(params) {
  return request({
    url: '/gift-card/history',
    method: 'get',
    params
  });
}
