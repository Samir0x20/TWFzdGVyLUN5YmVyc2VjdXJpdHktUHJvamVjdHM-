import { derived, writable } from 'svelte/store';
import { env } from "$env/dynamic/public";
import { user } from '@stores/auth';
import { get } from 'svelte/store';
import axios from 'axios';

const gateway = env.PUBLIC_API_GATEWAY_URL;

export const products = createProducts();


async function getProducts() {
	try {
		const response = await axios.get(`${gateway}/product`);
		if (response.status !== 200) {
			throw new Error('Failed to fetch products');
		  }
		products.set(response.data.products);
		
		return response.products;
	} catch (err) {
		console.error('Failed to fetch products data', err);
	}
}


async function deleteProduct(productId) {
	const $user = get(user);
	if ($user.isAdmin && $user.isLogged) {
		try {
			return await axios.delete(`${gateway}/product/delete/${productId}`, {
                headers: {
                    Authorization: `Bearer ${$user.token}`
                }
            });
		} catch (err) {
			console.error('Failed to delete product data', err);
		}
	}
}

async function updateProduct(product) {
    const $user = get(user);
    if ($user.isAdmin && $user.isLogged) {
        try {
            // Create a FormData object to hold the product data and the image file
			if (product.image === '') {
				return await axios.put(`${gateway}/product/update/${productId}`, {
					name: product.name,
					price: product.price,
					category: product.category,
					url: product.url
				}, {
					headers: {
						Authorization: `Bearer ${$user.token}`
					}
				});
			} else {
				const formData = new FormData();
				formData.append('name', product.name);
				formData.append('price', product.price);
				formData.append('category', product.category);
				formData.append('url', product.url);
				formData.append('image', product.image);

				return await axios.put(`${gateway}/product/update/${product.id}`, formData, {
					headers: {
						Authorization: `Bearer ${$user.token}`,
						'Content-Type': 'multipart/form-data'
					}
				});
			}
        } catch (err) {
            console.error('Failed to update product data', err);
        }
    }
}

async function saveProduct(newProduct) {
    const $user = get(user);
    if ($user.isAdmin && $user.isLogged) {
        try {
            // Create a FormData object to hold the product data and the image file
            const formData = new FormData();
            formData.append('name', newProduct.name);
            formData.append('price', newProduct.price);
            formData.append('category', newProduct.category);
			formData.append('url', newProduct.url);
            formData.append('image', newProduct.image); 

            return await axios.post(`${gateway}/product/save`, formData, {
                headers: {
                    Authorization: `Bearer ${$user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (err) {
            console.error('Failed to save product data', err);
        }
    }
}

function createProducts() {

	const { subscribe, set, update } = writable(getProducts());

	
	return {
		subscribe,
		update,
		set,
		__addProduct: (product) =>
			update((oldProducts) => {
				const response = saveProduct(product);
				
				if (response.status === 200) {
					if (!(product.category in oldProducts)) {
						oldProducts[product.category] = [];
					}
					oldProducts[product.category].push({ ...product, id: response.data.id });
				}
				return oldProducts;
			}),
		updateProduct: (product) =>
			update((oldProducts) => {
				const response = updateProduct(product);

				if (response.status === 200) {
					const category = oldProducts[product.category];
					const index = category.findIndex((p) => p.id === productId);
					category[index] = product;
				}
				return oldProducts;
			}),
		deleteProduct: (productId) =>
			update((oldProducts) => {
				const response = deleteProduct(productId);

				if (response.status === 200) {
					const category = Object.values(oldProducts).flat();
					const index = category.findIndex((p) => p.id === productId);
					category.splice(index, 1);
				}
				return oldProducts;
			}),
		getProduct: (productName) => {
			const productsInfo = get(products);
			const product = Object.values(productsInfo).flat().find((p) => p.name === productName);
			return product;
		}
	};
}


export const productsMerged = derived(products, ($products) => {
	return Object.values($products).flat();
});
