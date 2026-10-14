/* ===================================
   WEDDING INVITATION JAVASCRIPT
   Nasik & Nabila
   =================================== */

(function() {
    'use strict';

    // ============ CONFIGURATION ============
    const CONFIG = {
        weddingDate: '2026-11-07T08:30:00+07:00',
        rsvpEndpoint: 'https://script.google.com/macros/s/AKfycbyaSUFaDtKb8e_ERpT95B_ifV3cvtf_pGJ6vp_MZe_EJbx_ktxzqj01xjd_Qtjv04mN/exec',
        defaultGuestName: 'Tamu Undangan',
        localStorageKeys: {
            guestName: 'wedding_guest_name',
            rsvpSubmitted: 'wedding_rsvp_submitted',
            cachedWishes: 'wedding_cached_wishes'
        }
    };

    // ============ GLOBAL STATE ============
    let scrollRevealObserver = null;
    let isInvitationOpened = false;

    // ============ UTILITY FUNCTIONS ============
    
    /**
     * Safe localStorage wrapper with try-catch
     */
    const storage = {
        get(key) {
            try {
                return localStorage.getItem(key);
            } catch (e) {
                console.warn('localStorage not available:', e);
                return null;
            }
        },
        set(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                console.warn('localStorage not available:', e);
                return false;
            }
        },
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('localStorage not available:', e);
                return false;
            }
        }
    };

    /**
     * Show toast notification
     */
    function showToast(message, duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    /**
     * Decode URL-encoded guest name
     */
    function decodeGuestName(name) {
        if (!name) return CONFIG.defaultGuestName;
        
        try {
            return decodeURIComponent(name.replace(/\+/g, ' '));
        } catch (e) {
            return name.replace(/\+/g, ' ');
        }
    }

    /**
     * Get guest name from URL query parameters
     */
    function getGuestNameFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const name = urlParams.get('to') || urlParams.get('n') || urlParams.get('p');
        
        if (name) {
            return decodeGuestName(name);
        }
        
        const storedName = storage.get(CONFIG.localStorageKeys.guestName);
        if (storedName) {
            return storedName;
        }
        
        return CONFIG.defaultGuestName;
    }

    /**
     * Format date to Indonesian locale (Jakarta timezone)
     */
    function formatDateIndonesian(dateString) {
        try {
            const date = new Date(dateString);
            const options = {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta'
            };
            
            const formatted = new Intl.DateTimeFormat('id-ID', options).format(date);
            return formatted + ' WIB';
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Throttle function for scroll handlers
     */
    function throttle(func, delay) {
        let lastCall = 0;
        let timeoutId = null;
        
        return function(...args) {
            const now = Date.now();
            
            if (now - lastCall >= delay) {
                lastCall = now;
                func.apply(this, args);
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    lastCall = Date.now();
                    func.apply(this, args);
                }, delay - (now - lastCall));
            }
        };
    }

    /**
     * Check if user prefers reduced motion
     */
    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    // ============ COVER & SCROLL LOCK ============
    
    function initCover() {
        const cover = document.getElementById('cover');
        const openBtn = document.getElementById('openInvitation');
        const guestNameInput = document.getElementById('guestName');
        const body = document.body;
        
        if (!cover || !openBtn || !guestNameInput) return;
        
        body.classList.add('noscroll');
        body.classList.add('no-scroll');
        
        const guestName = getGuestNameFromURL();
        guestNameInput.value = guestName;
        
        guestNameInput.addEventListener('input', () => {
            storage.set(CONFIG.localStorageKeys.guestName, guestNameInput.value);
        });
        
        openBtn.addEventListener('click', () => {
            if (isInvitationOpened) return;
            isInvitationOpened = true;
            
            const rsvpNameInput = document.getElementById('rsvpName');
            if (rsvpNameInput) {
                rsvpNameInput.value = guestNameInput.value;
            }
            
            cover.classList.add('slide-up');
            cover.classList.add('hero-out');
            
            body.classList.remove('noscroll');
            body.classList.remove('no-scroll');
            
            startBackgroundMusic();
            
            setTimeout(() => {
                cover.style.display = 'none';
            }, 800);
            
            setTimeout(() => {
                initScrollReveal();
            }, 900);
            
            setTimeout(() => {
                initParallax();
            }, 1000);
            
            const musicToggle = document.getElementById('musicToggle');
            if (musicToggle) {
                musicToggle.style.display = 'flex';
            }
        });
    }

    // ============ SCROLL REVEAL ANIMATIONS (REPEATING SCROLL) ============

    function initScrollReveal() {
        if (prefersReducedMotion()) {
            document.querySelectorAll('.reveal, [data-aos]').forEach(el => {
                el.classList.add('is-visible');
                el.classList.add('aos-animate');
            });
            return;
        }
        
        const revealElements = document.querySelectorAll('.reveal, [data-aos]');
        if (!revealElements.length) return;
        
        scrollRevealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const delay = entry.target.getAttribute('data-delay') || 
                              entry.target.getAttribute('data-aos-delay') || 0;

                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('is-visible');
                        entry.target.classList.add('aos-animate');
                    }, parseInt(delay));
                } else {
                    entry.target.classList.remove('is-visible');
                    entry.target.classList.remove('aos-animate');
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });
        
        revealElements.forEach(el => {
            scrollRevealObserver.observe(el);
        });
        
        console.log('✨ Scroll reveal initialized:', revealElements.length, 'elements');
    }

    // ============ PARALLAX EFFECT ============
    
    function initParallax() {
        if (prefersReducedMotion()) return;
        
        const parallaxElements = document.querySelectorAll('.parallax-flower');
        if (!parallaxElements.length) return;
        
        const updateParallax = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const windowCenter = scrollY + windowHeight / 2;
            
            parallaxElements.forEach(el => {
                const rect = el.getBoundingClientRect();
                const elementCenter = scrollY + rect.top + rect.height / 2;
                const distance = windowCenter - elementCenter;
                const speed = parseFloat(el.getAttribute('data-speed')) || 0.1;
                const offset = distance * speed;
                
                el.style.translate = `0 ${offset}px`;
            });
        };
        
        const throttledParallax = throttle(() => {
            requestAnimationFrame(updateParallax);
        }, 16);
        
        window.addEventListener('scroll', throttledParallax, { passive: true });
        updateParallax();
    }

    // ============ BACKGROUND MUSIC ============
    
    function initBackgroundMusic() {
        const musicToggle = document.getElementById('musicToggle');
        const bgMusic = document.getElementById('bgMusic');
        
        if (!musicToggle || !bgMusic) return;
        
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play()
                    .then(() => {
                        musicToggle.setAttribute('aria-pressed', 'true');
                        musicToggle.setAttribute('aria-label', 'Pause music');
                    })
                    .catch(err => console.warn('Music play failed:', err));
            } else {
                bgMusic.pause();
                musicToggle.setAttribute('aria-pressed', 'false');
                musicToggle.setAttribute('aria-label', 'Play music');
            }
        });
    }
    
    function startBackgroundMusic() {
        const bgMusic = document.getElementById('bgMusic');
        const musicToggle = document.getElementById('musicToggle');
        
        if (!bgMusic) return;
        
        bgMusic.play()
            .then(() => {
                if (musicToggle) {
                    musicToggle.setAttribute('aria-pressed', 'true');
                    musicToggle.setAttribute('aria-label', 'Pause music');
                }
            })
            .catch(err => {
                console.warn('Auto-play failed (browser policy):', err);
            });
    }

    // ============ COUNTDOWN TIMER ============
    
    function initCountdown() {
        const daysEl = document.getElementById('days');
        const hoursEl = document.getElementById('hours');
        const minutesEl = document.getElementById('minutes');
        const secondsEl = document.getElementById('seconds');
        
        if (!daysEl || !hoursEl || !minutesEl || !secondsEl) return;
        
        const weddingDate = new Date(CONFIG.weddingDate).getTime();
        
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = weddingDate - now;
            
            if (distance < 0) {
                daysEl.textContent = '00';
                hoursEl.textContent = '00';
                minutesEl.textContent = '00';
                secondsEl.textContent = '00';
                return;
            }
            
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            daysEl.textContent = String(days).padStart(2, '0');
            hoursEl.textContent = String(hours).padStart(2, '0');
            minutesEl.textContent = String(minutes).padStart(2, '0');
            secondsEl.textContent = String(seconds).padStart(2, '0');
        }
        
        updateCountdown();
        setInterval(updateCountdown, 1000);
    }

    // ============ COPY TO CLIPBOARD ============
    
    function initCopyButtons() {
        const copyButtons = document.querySelectorAll('.btn-copy');
        
        copyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const textToCopy = btn.getAttribute('data-copy');
                if (!textToCopy) return;
                
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(textToCopy)
                        .then(() => {
                            showToast('Berhasil disalin!');
                        })
                        .catch(err => {
                            console.warn('Clipboard API failed:', err);
                            fallbackCopy(textToCopy);
                        });
                } else {
                    fallbackCopy(textToCopy);
                }
            });
        });
    }
    
    function fallbackCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast('Berhasil disalin!');
            } else {
                showToast('Gagal menyalin. Silakan salin manual.');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            showToast('Gagal menyalin. Silakan salin manual.');
        }
        
        document.body.removeChild(textArea);
    }

    // ============ RSVP FORM ============
    
    function initRSVPForm() {
        const form = document.getElementById('rsvpForm');
        const btnSubmit = document.getElementById('btnSubmit');
        const formMessage = document.getElementById('formMessage');
        
        const decreaseBtn = document.getElementById('decreaseBtn');
        const increaseBtn = document.getElementById('increaseBtn');
        const jumlahValue = document.getElementById('jumlahValue');
        const rsvpJumlah = document.getElementById('rsvpJumlah');
        
        let currentValue = 1;
        
        if (decreaseBtn && increaseBtn && jumlahValue && rsvpJumlah) {
            decreaseBtn.addEventListener('click', () => {
                if (currentValue > 1) {
                    currentValue--;
                    jumlahValue.textContent = currentValue;
                    rsvpJumlah.value = currentValue;
                }
                decreaseBtn.disabled = currentValue <= 1;
                increaseBtn.disabled = false;
            });
            
            increaseBtn.addEventListener('click', () => {
                if (currentValue < 10) {
                    currentValue++;
                    jumlahValue.textContent = currentValue;
                    rsvpJumlah.value = currentValue;
                }
                increaseBtn.disabled = currentValue >= 10;
                decreaseBtn.disabled = false;
            });
            
            decreaseBtn.disabled = currentValue <= 1;
        }
        
        if (!form || !btnSubmit || !formMessage) return;
        
        const hasSubmitted = storage.get(CONFIG.localStorageKeys.rsvpSubmitted);
        if (hasSubmitted === 'true') {
            formMessage.textContent = 'Anda sudah mengirim RSVP. Terima kasih!';
            formMessage.className = 'form-message success';
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Mengirim...';
            formMessage.textContent = '';
            formMessage.className = 'form-message';
            
            const formData = new FormData(form);
            const nama = formData.get('Nama').trim();
            const jumlah = formData.get('Jumlah');
            const status = formData.get('Status');
            const pesan = formData.get('Pesan').trim();
            
            if (!nama || !jumlah || !status || !pesan) {
                formMessage.textContent = 'Harap lengkapi semua field.';
                formMessage.className = 'form-message error';
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Kirim';
                return;
            }
            
            const urlEncodedData = new URLSearchParams({
                Nama: nama,
                Jumlah: jumlah,
                Status: status,
                Pesan: pesan
            });
            
            try {
                await fetch(CONFIG.rsvpEndpoint, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: urlEncodedData.toString()
                });
                
                formMessage.textContent = 'Terima kasih! RSVP Anda berhasil dikirim.';
                formMessage.className = 'form-message success';
                
                storage.set(CONFIG.localStorageKeys.rsvpSubmitted, 'true');
                
                form.reset();
                currentValue = 1;
                if (jumlahValue) jumlahValue.textContent = '1';
                if (rsvpJumlah) rsvpJumlah.value = '1';
                if (decreaseBtn) decreaseBtn.disabled = true;
                if (increaseBtn) increaseBtn.disabled = false;
                
                setTimeout(() => {
                    loadWishes();
                }, 1200);
                
            } catch (error) {
                console.error('RSVP submission error:', error);
                formMessage.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
                formMessage.className = 'form-message error';
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Kirim';
            }
        });
    }

    // ============ WISHES LIST ============
    
    function initWishes() {
        loadWishes();
    }
    
    async function loadWishes() {
        const wishesList = document.getElementById('wishesList');
        if (!wishesList) return;
        
        wishesList.innerHTML = '<div class="wishes-loading">Memuat ucapan...</div>';
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(CONFIG.rsvpEndpoint, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.result !== 'success' || !Array.isArray(data.data)) {
                throw new Error('Invalid response format');
            }
            
            storage.set(CONFIG.localStorageKeys.cachedWishes, JSON.stringify(data.data));
            displayWishes(data.data);
            
        } catch (error) {
            console.error('Failed to load wishes:', error);
            
            const cachedData = storage.get(CONFIG.localStorageKeys.cachedWishes);
            if (cachedData) {
                try {
                    const wishes = JSON.parse(cachedData);
                    displayWishes(wishes);
                    
                    const notice = document.createElement('div');
                    notice.className = 'wishes-cache-notice';
                    notice.textContent = '(Data dari cache terakhir)';
                    notice.style.cssText = 'text-align: center; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;';
                    wishesList.insertBefore(notice, wishesList.firstChild);
                    
                } catch (e) {
                    showErrorState(wishesList, error.name === 'AbortError');
                }
            } else {
                showErrorState(wishesList, error.name === 'AbortError');
            }
        }
    }
    
    function displayWishes(wishes) {
        const wishesList = document.getElementById('wishesList');
        const commentCount = document.getElementById('commentCount');
        const statHadir = document.getElementById('statHadir');
        const statTidakHadir = document.getElementById('statTidakHadir');
        
        if (!wishesList) return;
        
        wishesList.innerHTML = '';
        
        const sortedWishes = [...wishes].reverse();
        
        const hadirCount = wishes.filter(w => w.Status === 'Hadir').length;
        const tidakHadirCount = wishes.filter(w => w.Status === 'Tidak Hadir').length;
        
        if (commentCount) commentCount.textContent = `${wishes.length} Comments`;
        if (statHadir) statHadir.textContent = hadirCount;
        if (statTidakHadir) statTidakHadir.textContent = tidakHadirCount;
        
        if (sortedWishes.length === 0) {
            wishesList.innerHTML = '<div class="wishes-empty">Belum ada ucapan. Jadilah yang pertama!</div>';
            return;
        }
        
        sortedWishes.forEach(wish => {
            const wishItem = createWishElement(wish);
            wishesList.appendChild(wishItem);
        });
    }
    
    function createWishElement(wish) {
        const div = document.createElement('div');
        div.className = 'wish-item';
        
        const nama = wish.Nama || 'Anonim';
        const jumlah = wish.Jumlah || '1';
        const status = wish.Status || 'Hadir';
        const pesan = wish.Pesan || '';
        const timestamp = wish.Timestamp || '';
        
        const formattedDate = timestamp ? formatDateIndonesian(timestamp) : '';
        const badgeClass = status === 'Hadir' ? 'hadir' : 'tidak-hadir';
        
        div.innerHTML = `
            <div class="wish-header">
                <span class="wish-name"></span>
                <span class="wish-badge ${badgeClass}"></span>
            </div>
            <div class="wish-meta">
                <span class="wish-guests"></span>
                <span>•</span>
                <span class="wish-date"></span>
            </div>
            <p class="wish-message"></p>
        `;
        
        div.querySelector('.wish-name').textContent = nama;
        div.querySelector('.wish-badge').textContent = status;
        div.querySelector('.wish-guests').textContent = `${jumlah} orang`;
        div.querySelector('.wish-date').textContent = formattedDate;
        div.querySelector('.wish-message').textContent = pesan;
        
        return div;
    }
    
    function showErrorState(wishesList, isTimeout) {
        const message = isTimeout 
            ? 'Gagal memuat ucapan (timeout). Silakan coba lagi.'
            : 'Gagal memuat ucapan. Silakan coba lagi.';
        
        wishesList.innerHTML = `
            <div class="wishes-error">
                <p>${message}</p>
                <button class="btn-retry" onclick="window.weddingApp.retryLoadWishes()">Coba Lagi</button>
            </div>
        `;
    }

    // ============ INITIALIZATION ============
    
    function init() {
        initCover();
        initBackgroundMusic();
        initCountdown();
        initCopyButtons();
        initRSVPForm();
        initWishes();
        
        console.log('✨ Wedding invitation initialized');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.weddingApp = {
        retryLoadWishes: loadWishes
    };

})();
