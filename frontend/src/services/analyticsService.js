import api from "../api/api";

export const getDashboardAnalytics = async (dateFilter = '7') => {
    try {
        const response = await api.get(`/analytics/dashboard?dateFilter=${dateFilter}`);
        return response.data;
    } catch (error) {
        console.error("Dashboard Analytics Error:", error);
        throw error;
    }
};

export const getReportAnalytics = async (timeframe = 'all') => {
    try {
        const response = await api.get(`/analytics/reports?timeframe=${timeframe}`);
        return response.data;
    } catch (error) {
        console.error("Report Analytics Error:", error);
        throw error;
    }
};
