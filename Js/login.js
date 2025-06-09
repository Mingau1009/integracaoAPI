const API_BASE_URL = 'https://umfgcloud-autenticacao-service-7e27ead80532.herokuapp.com';

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('authToken')) {
        window.location.href = 'telaInicial.html';
        return;
    }

    const body = document.querySelector('body');
    const signInButton = document.querySelector('#signIn');
    const signUpButton = document.querySelector('#signUp');
    const loginForm = document.querySelector('#loginForm');
    const registerForm = document.querySelector('#registerForm');
    const loginMessageEl = document.querySelector('#loginMessage');
    const registerMessageEl = document.querySelector('#registerMessage');

    const showMessage = (el, msg, isError = true) => {
        if (!el) return;
        el.textContent = msg;
        el.className = isError ? 'form-message error' : 'form-message success';
    };

    const showLoading = (show = true) => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay && show) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(overlay);
        } else if (overlay && !show) {
            overlay.remove();
        }
    };

    const parseApiError = (err) => {
        if (err?.message) return err.message;
        if (err?.errors) return Object.values(err.errors).flat().join(' ');
        if (typeof err === 'string') {
            try {
                const parsed = JSON.parse(err);
                if (parsed?.message) return parsed.message;
            } catch {}
            return err;
        }
        if (err?.title) return err.title;
        return "Ocorreu um erro desconhecido.";
    };

    const switchView = (view) => {
        if (body) body.className = view;
        showMessage(loginMessageEl, '');
        showMessage(registerMessageEl, '');
    };

    if (body) body.className = 'on-load';

    signInButton?.addEventListener('click', () => switchView('sign-in'));
    signUpButton?.addEventListener('click', () => switchView('sign-up'));


    const validatePasswordStrength = (password) => {
        if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres";
        if (!/[A-Z]/.test(password)) return "A senha deve conter pelo menos uma letra maiúscula";
        if (!/[0-9]/.test(password)) return "A senha deve conter pelo menos um número";
        return null;
    };

    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(true);
        showMessage(registerMessageEl, '');

        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showMessage(registerMessageEl, "As senhas não coincidem!");
            showLoading(false);
            return;
        }

        const passwordError = validatePasswordStrength(password);
        if (passwordError) {
            showMessage(registerMessageEl, passwordError);
            showLoading(false);
            return;
        }

        if (!email || !password) {
            showMessage(registerMessageEl, "Por favor, preencha e-mail, senha e confirmação de senha.");
            showLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/Autenticacao/registar`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, senha: password, senhaConfirmada: confirmPassword})
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }

            if (res.ok) {
                showMessage(registerMessageEl, data?.message || "Cadastro realizado com sucesso! Você será redirecionado para o login.", false);
                setTimeout(() => {
                    switchView('sign-in');
                    registerForm?.reset();
                    document.getElementById('loginEmail').value = email;
                    showMessage(loginMessageEl, "Cadastro efetuado! Faça o login para continuar.", false);
                    showLoading(false);
                }, 3000);
            } else {
                showMessage(registerMessageEl, parseApiError(data) || `Erro ${res.status}`);
                showLoading(false);
            }
        } catch (err) {
            console.error("Registration error:", err);
            showMessage(registerMessageEl, "Erro de conexão ao tentar cadastrar. Tente novamente mais tarde.");
            showLoading(false);
        }
    });

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        showLoading(true);
        showMessage(loginMessageEl, '');

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            showMessage(loginMessageEl, "Por favor, preencha e-mail e senha.");
            showLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/Autenticacao/autenticar`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, senha: password})
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }

            if (res.ok) {
                const {token, dataExpiracao} = data;
                if (token && dataExpiracao) {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('tokenExpiry', new Date(dataExpiracao).toLocaleString('pt-BR', {dateStyle: 'short', timeStyle: 'short'}));
                    
                   
                    setTimeout(() => {
                        window.location.href = 'telaInicial.html';
                        showLoading(false);
                    }, 1000);
                } else {
                    showMessage(loginMessageEl, "Resposta de login inválida. Token ou data de expiração não encontrados.");
                    console.warn("Login response missing token or expiration:", data);
                    showLoading(false);
                }
            } else {
                showMessage(loginMessageEl, parseApiError(data) || `Erro ${res.status}: Usuário ou senha inválidos.`);
                showLoading(false);
            }
        } catch (err) {
            console.error("Login error:", err);
            showMessage(loginMessageEl, "Erro de conexão ao tentar fazer login. Verifique sua conexão e tente novamente.");
            showLoading(false);
        }
    });

    document.querySelectorAll('.toggle-password').forEach(function(toggle) {
        toggle.addEventListener('click', function() {
            const input = document.querySelector(this.getAttribute('toggle'));
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });

    const savedEmail = localStorage.getItem('lastEmail');
    if (savedEmail && document.getElementById('loginEmail')) {
        document.getElementById('loginEmail').value = savedEmail;
    }

    const loginEmailInput = document.getElementById('loginEmail');
    if (loginEmailInput) {
        loginEmailInput.addEventListener('input', (e) => {
            localStorage.setItem('lastEmail', e.target.value.trim());
        });
    }
});