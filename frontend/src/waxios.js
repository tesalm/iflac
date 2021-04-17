import axios from 'axios';

function addAxiosInterceptors(axiosInstance) {
  // Request interceptor
  axiosInstance.interceptors.request.use(function (config) {
    // Add JWT token to all requests
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['X-Access-Token'] = token;
    }

    config.headers['X-Requested-With'] = 'XMLHttpRequest';

    return config;
  }, function (error) {
    return Promise.reject(error);
  });

  // Response interceptor
  axiosInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response.status === 401) {
      localStorage.removeItem('access_token');
    }

    return Promise.reject(error);
  });
}

let axiosInstance = axios.create();
addAxiosInterceptors(axiosInstance);
export default axiosInstance;