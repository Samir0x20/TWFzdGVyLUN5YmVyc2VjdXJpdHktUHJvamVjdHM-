import { derived, writable } from 'svelte/store';
import { get } from 'svelte/store';
import { user } from '@stores/auth';
import axios from 'axios';
import { env } from "$env/dynamic/public";

const gateway = env.PUBLIC_API_GATEWAY_URL;


function createCart() {
    const { subscribe, set, update } = writable([]);

    // Function to save cart data to backend
    async function saveCart(cart) {
        const $user = get(user);
        if ($user.isLogged) {
            try {
                await axios.post(`${gateway}/cart/save`, {cart: cart }, {
                    headers: {
                        Authorization: `Bearer ${$user.token}`
                    }
                });
            } catch (err) {
                console.error("Failed to save cart data", err);
            }
        }
    }

    // Function to save removed item to backend
    async function saveRemovedItem(item) {
        const $user = get(user);
        if ($user.isLogged) {
            try {
                await axios.post(`${gateway}/cart/remove`, {item: item }, {
                    headers: {
                        Authorization: `Bearer ${$user.token}`
                    }
                });
            } catch (err) {
                console.error("Failed to save removed item", err);
            }
        }
    }

    return {
        subscribe,
        update,
        getCart: () => {
            return get(cart);
        },
        addToCart: (item) =>
            update((oldCart) => {
                const itemIndex = oldCart.findIndex((e) => e.id === item.id);
                let newCart;
                if (itemIndex === -1) {
                    newCart = [...oldCart, item];
                } else {
                    oldCart[itemIndex].quantity += item.quantity;
                    newCart = oldCart;
                }
                saveCart(newCart);
                return newCart;
            }),
        setCart: (newCart) => {
            set(newCart);
        },
        clearCart: () => {
            saveCart([]);
            set([]);
        },
        removeFromCart: (item) => {
            update((oldCart) => {
                const newCart = oldCart.filter(cartItem => cartItem.id !== item.id);
                saveCart(newCart);
                saveRemovedItem(item);
                return newCart;
            });
        }
    };
}

export const cart = createCart();

export const totalQuantity = derived(cart, ($cart) =>
    $cart.reduce((acc, curr) => acc + curr.quantity, 0)
);

export const totalPrice = derived(cart, ($cart) =>
    $cart.reduce((acc, curr) => acc + curr.quantity * curr.price, 0)
);
