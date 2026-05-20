export interface Location {
    id: string;
    name: string;
    city: string;
    province: string;
    isActive: boolean;
}

export interface StockBySize {
    size: string;
    location_id: string;
    location_name: string;
    available: number;
}

export interface Product {
    name: string;
    sku: string | null;
    price: number;
    priceSale: number | null;
    vendor: string;
    category: string;
    subcategory: string | null;
    color: string | null;
    size: string | null;
    size_option_name: string | null;
    images: string[];
    all_sizes: string[];
    available_sizes: string[];
    stock: Stock[];
    stock_by_size: StockBySize[];
    metafields: Record<string, string>;
}

export interface Stock {
    location_id: string;
    location_name: string;
    available: number;
}