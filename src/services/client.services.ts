import axios from 'axios';

const axiosInstanceClient = axios.create({
    // baseURL: 'http://localhost:8080/api',
    // baseURL: 'https://vedicbackend-4.onrender.com/api',
    baseURL: 'https://api.cosmicremediesbysia.com/api',
    withCredentials: true
});


export default axiosInstanceClient;