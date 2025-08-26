<script lang="ts">
	import { totalPrice, totalQuantity, cart } from '@stores/cart';
	import { onMount } from 'svelte';
	import { env } from "$env/dynamic/public";
	import axios from "axios";
    import { get } from 'svelte/store';
    import { user } from '@stores/auth';
    import { success } from '@stores/toasts';

	const gateway = env.PUBLIC_API_GATEWAY_URL;

	let prevCheckout: any[] = [];

	onMount(async () => {
		const token = sessionStorage.getItem('token');
		if (token) {
			try {
				// Verify token and set user data
				const response = await axios.get(`${gateway}/verify/${token}`);
				if (response.status === 304 || response.status === 200) {
					const username = response.data.username;
					const isAdmin = response.data.isAdmin;
					user.set({ isLogged: true, isAdmin, username, token });

					const checkoutResponse = await axios.get(`${gateway}/checkout/load/${username}`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
					prevCheckout = checkoutResponse.data.checkouts || [];
				}

			} catch (err) {
				console.error("Failed to verify token or load data", err);
			}
		}
		else{
			window.location.href = '/';
		}
  	});

	async function handleCheckout() {
        const $user = get(user);
		let newCheckout = {
                items: get(cart),
                extras: {
                    totalQuantity: get(totalQuantity),
                    totalPrice: get(totalPrice),
                    date: new Date().toLocaleDateString('fr')
                }
            };

		prevCheckout = [...prevCheckout, newCheckout];
		
        if ($user.isLogged) {
            try {
                const response = await axios.post(`${gateway}/checkout/save`, {checkout: newCheckout}, {
                    headers: {
                        Authorization: `Bearer ${$user.token}`
                    }
                });
				
                if (response.status !== 200) {
                  	throw new Error('Failed to save checkout data');
                }

                success("Checkout completed successfully");
                cart.clearCart();
            } catch (err) {
                error("Failed to save checkout data");
            }
        }
    }
</script>

<!-- Header-->
<header class="py-5 bg-gradient-to-r from-pink-500 to-yellow-500">
	<div class="container px-4 px-lg-5 my-3">
		<div class="text-center text-white">
			<h1 class="display-4 fw-bolder">Checkout</h1>
		</div>
	</div>
</header>
<div class="container p-3 max-w-4xl">
	<main>
		<div class="py-5 row g-5">
			<!-- Current cart -->
			<div class="col-md-6 col-lg-5 order-md-last">
				<h4 class="d-flex justify-content-end align-items-center mb-3">
					<span class="text-primary text-2xl pr-3">Your cart</span>
					<span class="badge bg-primary rounded-pill">{$totalQuantity}</span>
				</h4>
				<ul class="list-group mb-3">
					{#if $cart.length > 0}
						{#each $cart as item}
							<li class="list-group-item grid grid-flow-row-dense grid-cols-4 lh-sm">
								<img class="object-contain h-10 w-10" src={item.url} alt={item.name} />
								<div class="m-auto">{item.name}</div>
								<span class="text-body-secondary text-gray-500 m-auto">{item.quantity}</span>
								<span class="text-body-secondary text-gray-500 m-auto"
									>${item.price * item.quantity}</span
								>
							</li>
						{/each}
						<form method="POST" on:submit|preventDefault={handleCheckout}>
							<button
								class="w-100 btn btn-primary bg-gradient-to-r from-pink-500 to-yellow-500 hover:from-pink-600 hover:to-yellow-600 border-none my-3"
								type="submit">Checkout</button
							>
						</form>
					{:else}
						<li class="list-group-item grid grid-flow-row-dense lh-sm">Your cart is empty</li>
					{/if}
				</ul>
			</div>
			<!-- Previous purchases -->
			<div class="col-md-6 col-lg-7">
				<h1 class="text-2xl mb-3 text-center">Purchase history</h1>
				<ul class="list-group mb-3">
					{#if prevCheckout}
						{#each prevCheckout as checkout}
							<li class="list-group-item grid grid-flow-row-dense grid-cols-2 lh-sm">
								{#each checkout.items as item}
									<div class="m-auto flex justify-end w-full">
										<img class="object-contain h-10 w-10" src={item.url} alt={item.name} />
										<span class="my-auto">
											{item.quantity} x
											{item.name}</span
										>
									</div>
									<span class="text-body-secondary text-gray-500 m-auto"
										>${item.price * item.quantity}</span
									>
								{/each}
								<div class="m-auto w-full pt-2 col-auto">Total: ${checkout.extras.totalPrice}</div>
							</li>
						{/each}
					{:else}
						<li class="list-group-item grid grid-flow-row-dense lh-sm">Your cart is empty</li>
					{/if}
				</ul>
			</div>
		</div>
	</main>
</div>
