import axios from 'axios';

const axiosInstance = axios.create({
    // baseURL: 'http://localhost:8080/api/admin',
    baseURL: 'https://vedicbackend-4.onrender.com/api/admin',
    withCredentials: true
});


export default axiosInstance;