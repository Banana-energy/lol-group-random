import axios, { AxiosError, AxiosRequestConfig } from "axios";
import { start, done } from "@/utils/nprogress";
import qs from "qs";
import to from "await-to-js";
import env from "@/config/env.config";
import { Message } from '@arco-design/web-vue';

const TIMEOUT = import.meta.env.DEV ? 1000 * 20 : undefined;

const service = axios.create({
  baseURL: env.baseUrl,
  withCredentials: true,
  timeout: TIMEOUT,
});

const handleError = (msg?: string) => {
  const localMsg = msg || '客户端异常'
  Message.error(localMsg);
};

service.interceptors.request.use(
  (config) => {
    start();
    // 处理 get 请求的 data 参数
    if (config.method === "get" && config.data) {
      config.url += "?" + qs.stringify(config.data);
    }
    return config;
  },
  (error) => {
    done();
    handleError();
    return Promise.reject(error);
  }
);

service.interceptors.response.use(
  (response) => {
    done();
    const { data } = response;
    return data;
  },
  (error: AxiosError) => {
    if (!env.isProd) {
      console.error(error);
    }
    done();
    handleError(error.message || '客户端异常');
    return Promise.reject(error);
  }
);

// -------------------------------------------------
//            ↓ 请求上层封装 ↓
// -------------------------------------------------

type Response<T = Record<string, never>> = {
  success?: boolean;
  code?: number;
  msg?: string;
  data?: T;
} & T;

type ResponsePromise<T> = Promise<[Error, undefined] | [null, Response<T>]>;

function _get<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;

function _get(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "GET",
      ...config,
    })
  );
}

function _putJSON<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;

function _putJSON(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    })
  );
}

function _postJSON<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;

function _postJSON(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    })
  );
}

// post formData
function _postFormData<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;

function _postFormData(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "POST",
      headers: {
        "Content-Type": "multipart/form-data",
      },
      ...config,
    })
  );
}

// post form
function _postForm<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;
function _postForm(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      ...config,
    })
  );
}

// 导出文件
function _exportFile<T = Record<string, never>>(
  config: AxiosRequestConfig
): ResponsePromise<T>;
function _exportFile(config: AxiosRequestConfig) {
  return to(
    service.request({
      method: "GET",
      responseType: "blob",
      ...config,
    })
  );
}

export const postForm = _postForm;
export const postFormData = _postFormData;
export const get = _get;
export const postJSON = _postJSON;
export const putJSON = _putJSON;
export const exportFile = _exportFile;
