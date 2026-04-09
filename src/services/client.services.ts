import axios from 'axios';

const axiosInstanceClient = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: true
});


export default axiosInstanceClient;