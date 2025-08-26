<script>
	import { goto } from '$app/navigation';
	import { env } from "$env/dynamic/public";
	import axios from "axios";

	import { user } from '../../stores/auth';
	import { addToast } from '../../stores/toasts';
    import { cart } from '@stores/cart';

	const gateway = env.PUBLIC_API_GATEWAY_URL;

	let username = '';
	let password = '';

	async function handleOnSubmit() {
		try {
            const response = await axios.post(`${gateway}/login`, { username, password });
			if (response.status === 200) {
				const token = response.data.token; 
				const isAdmin = response.data.isAdmin;

				user.set({ isLogged: true, isAdmin, username, token });

				// Save the token to session storage
				sessionStorage.setItem('token', token);

				// Fetch cart data after successful login
                const cartResponse = await axios.get(`${gateway}/cart/${username}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
				const cartData = cartResponse.data.cart;
				cart.setCart(cartData);

				addToast({
					message: "Login succeeded: Welcome!",
					type: "success",
					dismissible: true,
					timeout: 1000,
				});
				window.location.href = "/";			
			}
        } catch (err) {
            addToast({
                message: "Login completed with an error.",
                type: "error",
                dismissible: true,
                timeout: 1000,
            });
        }
	}
</script>

<form method="POST" on:submit|preventDefault={handleOnSubmit}>
	<div class="container py-5 h-100">
		<div class="row d-flex justify-content-center align-items-center h-100">
			<div class="col-12 col-md-8 col-lg-6 col-xl-5">
				<div class="card shadow-2-strong" style="border-radius: 1rem;">
					<div class="card-body p-5 text-center">
						<h3 class="mb-5">Sign in</h3>

						<div class="form-outline mb-4">
							<input id="username" class="form-control form-control-lg" bind:value={username} />
							<label class="form-label" for="username">Username</label>
						</div>

						<div class="form-outline mb-4">
							<input
								type="password"
								id="password"
								class="form-control form-control-lg"
								bind:value={password}
							/>
							<label class="form-label" for="password">Password</label>
						</div>

						<button class="btn btn-primary btn-lg btn-block" type="submit">Login</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</form>
