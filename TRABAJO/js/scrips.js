
function scrollToSede(id) {
        document.querySelectorAll('.sedes-nav button').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`button[onclick="scrollToSede('${id}')"]`).classList.add('active');
        
        document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
        }

        // Opcional: resaltar automáticamente al scrollear manualmente
        window.addEventListener('scroll', () => {
        const sections = document.querySelectorAll('.sede-card');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
            current = section.getAttribute('id');
            }
        });
        
        document.querySelectorAll('.sedes-nav button').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(current)) {
            btn.classList.add('active');
            }
        });
});
/*
        let teto = document.getElementById("viernes_1600");
        let teto1 = "canselada";
        teto.textContent = teto1;*/