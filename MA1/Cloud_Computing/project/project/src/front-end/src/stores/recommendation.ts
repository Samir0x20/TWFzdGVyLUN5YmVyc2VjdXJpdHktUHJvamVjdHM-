import { derived, writable } from 'svelte/store';
import { get } from 'svelte/store';
import { products } from '@stores/products';

function createRecommendation() {
    const { subscribe, set, update } = writable([]);

    return {
        subscribe,
        update,
        setRecommendations: (newRecommendation) => {
            set(newRecommendation);
        },
        getRecommendations: (productName, cart) => {
            const recommendations = get(recommendation);
            const product = recommendations.find(item => item.key === productName);
            if (!product) return null;

            let highestProduct = null;
            let highestValue = -Infinity;

            Object.entries(product.value).forEach(([key, value]) => {
                if (!cart.includes(key) && value > highestValue) {
                    highestValue = value;
                    highestProduct = key;
                }
            });
            return products.getProduct(highestProduct);;
        }

    };
}

export const recommendation = createRecommendation();
