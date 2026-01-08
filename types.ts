export interface MenuOption {
  title: string;
  required: boolean;
  choices: string[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string; 
  options?: MenuOption[]; // List of configuration steps (e.g. "Choose Starter", "Choose Dish")
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedOptions?: { [key: string]: string }; // Stores the user's choices
}

export type OrderType = 'delivery' | 'pickup';

export type PageView = 'home' | 'order' | 'contact' | 'success';

export interface RestaurantInfo {
  name: string;
  address: string;
  phone: string;
  hours: {
    lunch: string;
    dinner: string;
  };
}