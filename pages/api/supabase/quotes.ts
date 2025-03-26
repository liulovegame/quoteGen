import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req;

    if (method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${method} Not Allowed`);
        return;
    }

    const { action } = req.body;

    switch (action) {
        case 'get':
            return handleGet(req, res);
        case 'create':
            return handlePost(req, res);
        case 'update':
            return handlePut(req, res);
        default:
            res.status(400).json({ error: 'Invalid action' });
    }
}

// 获取报价单列表或单个报价单
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { quote_number } = req.body;

        if (quote_number) {
            // 获取单个报价单及其服务费用
            const { data: quote, error: quoteError } = await supabase
                .from('quotes')
                .select('*')
                .eq('quote_number', quote_number)
                .single();

            if (quoteError) throw quoteError;

            // 获取关联的服务费用
            const { data: services, error: servicesError } = await supabase
                .from('quote_services')
                .select('*')
                .eq('quote_id', quote.id);

            if (servicesError) throw servicesError;

            return res.status(200).json({
                ...quote,
                services: services
            });
        } else {
            // 获取报价单列表
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.status(200).json(data);
        }
    } catch (error) {
        console.error('Error fetching quotes:', error);
        return res.status(500).json({ error: 'Error fetching quotes' });
    }
}

// 创建新报价单
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
    try {
        const quoteData = req.body.data;
        
        // 分离服务费用数据
        const { services, ...quoteInfo } = quoteData;
        
        // 创建报价单
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .insert([quoteInfo])
            .select('id')
            .single();

        if (quoteError) throw quoteError;

        // 如果有服务费用数据，创建服务费用记录
        if (services && services.length > 0) {
            const serviceRecords = services.map((service: any) => ({
                quote_id: quote.id,
                service_type: service.service_type,
                limit_amount: service.limit_amount,
                fee: service.fee
            }));

            const { error: servicesError } = await supabase
                .from('quote_services')
                .insert(serviceRecords);

            if (servicesError) throw servicesError;
        }

        return res.status(201).json({ success: true });
    } catch (error) {
        console.error('Error creating quote:', error);
        return res.status(500).json({ error: 'Error creating quote' });
    }
}

// 更新报价单
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { quote_number, data: updates } = req.body;

        if (!quote_number) {
            return res.status(400).json({ error: 'Missing quote number' });
        }

        // 分离服务费用数据
        const { services, ...quoteUpdates } = updates;

        // 获取报价单ID
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('id')
            .eq('quote_number', quote_number)
            .single();

        if (quoteError) throw quoteError;

        // 更新报价单
        const { error: updateError } = await supabase
            .from('quotes')
            .update(quoteUpdates)
            .eq('quote_number', quote_number);

        if (updateError) throw updateError;

        // 如果有服务费用数据，更新服务费用记录
        if (services) {
            // 先删除旧的服务费用记录
            const { error: deleteError } = await supabase
                .from('quote_services')
                .delete()
                .eq('quote_id', quote.id);

            if (deleteError) throw deleteError;

            // 创建新的服务费用记录
            if (services.length > 0) {
                const serviceRecords = services.map((service: any) => ({
                    quote_id: quote.id,
                    service_type: service.service_type,
                    limit_amount: service.limit_amount,
                    fee: service.fee
                }));

                const { error: servicesError } = await supabase
                    .from('quote_services')
                    .insert(serviceRecords);

                if (servicesError) throw servicesError;
            }
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating quote:', error);
        return res.status(500).json({ error: 'Error updating quote' });
    }
} 