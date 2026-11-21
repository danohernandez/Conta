lucide.createIcons();

// ==========================================
// NAVEGACIÓN ENTRE PÁGINAS / VISTAS
// ==========================================
function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.add('hidden');
    });

    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Actualizar estado activo de pestañas desktop
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('bg-brand-50', 'text-brand-800', 'font-semibold');
        tab.classList.add('text-slate-600', 'font-medium');
    });

    const activeTab = document.getElementById(`nav-${viewName}`);
    if (activeTab) {
        activeTab.classList.remove('text-slate-600', 'font-medium');
        activeTab.classList.add('bg-brand-50', 'text-brand-800', 'font-semibold');
    }

    // Cerrar menú móvil si está abierto y subir al inicio
    document.getElementById('mobile-menu').classList.add('hidden');
    document.getElementById('mobile-menu-btn').setAttribute('aria-expanded', 'false');
    document.getElementById('mobile-menu-btn').setAttribute('aria-label', 'Abrir menú');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
}

function scrollToServicios() {
    switchView('inicio');
    setTimeout(() => {
        const el = document.getElementById('servicios');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
}

// Menú móvil
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
mobileMenuBtn.addEventListener('click', () => {
    const expanded = !mobileMenu.classList.toggle('hidden');
    mobileMenuBtn.setAttribute('aria-expanded', String(expanded));
    mobileMenuBtn.setAttribute('aria-label', expanded ? 'Cerrar menú' : 'Abrir menú');
});
mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
});

// Filtro de Servicios
const filterBtns = document.querySelectorAll('.filter-btn');
const serviceCards = document.querySelectorAll('.service-card');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
            b.classList.remove('bg-brand-800', 'text-white');
            b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
        });
        btn.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
        btn.classList.add('bg-brand-800', 'text-white');

        const filter = btn.getAttribute('data-filter');
        serviceCards.forEach(card => {
            card.style.display = (filter === 'all' || card.getAttribute('data-category') === filter) ? 'flex' : 'none';
        });
    });
});

// ==========================================
// LÓGICA DEL COTIZADOR DETALLADO CABHEO
// ==========================================
let personType = 'fisica';
let subRegime = 'resico';

// Tarifas base por régimen y nivel de volumen (1 a 5) — IVA Incluido
const pricingMatrix = {
    resico: {
        name: 'Persona Física - RESICO',
        prices: [600, 950, 1450, 2100, 2900]
    },
    empresarial: {
        name: 'Persona Física - Actividad Empresarial',
        prices: [950, 1400, 2000, 2800, 3800]
    },
    digitales: {
        name: 'Persona Física - Servicios Digitales',
        prices: [850, 1300, 1850, 2600, 3500]
    },
    moral_resico: {
        name: 'Persona Moral - RESICO',
        prices: [2200, 2900, 3800, 4900, 6200]
    },
    moral_general: {
        name: 'Persona Moral - Régimen General',
        prices: [2800, 3600, 4600, 5800, 7400]
    }
};

const facturasLabels = {
    1: '1 a 20 facturas',
    2: '21 a 50 facturas',
    3: '51 a 120 facturas',
    4: '121 a 250 facturas',
    5: 'Más de 250 facturas'
};

const regimesByPerson = {
    fisica: [
        ['resico', 'RESICO'],
        ['empresarial', 'Actividad Empresarial'],
        ['digitales', 'Plataformas digitales']
    ],
    moral: [
        ['moral_general', 'Régimen General'],
        ['moral_resico', 'RESICO Persona Moral']
    ]
};

function selectPersonType(type) {
    personType = type;
    const regimeSelect = document.getElementById('quote-regime');
    const options = regimesByPerson[type].map(([value, label]) => new Option(label, value));
    regimeSelect.replaceChildren(...options);
    selectSubRegime(regimeSelect.value);
}

function selectSubRegime(regimeKey) {
    subRegime = regimeKey;
    calculateQuote();
}

function calculateQuote() {
    const level = parseInt(document.getElementById('facturas-range').value);
    const empleados = parseInt(document.getElementById('empleados-range').value);
    const hasInventarios = document.getElementById('addon-inventarios').checked;

    // Cálculos (Asesoría 1:1 y Facturación ya vienen incluidos; Inventarios es a consideración)
    const regimeData = pricingMatrix[subRegime];
    const basePrice = regimeData.prices[level - 1];
    const nominaCost = empleados * 100;
    const total = basePrice + nominaCost;

    // Actualizar tarjeta de resumen
    document.getElementById('plan-badge').textContent = regimeData.name;
    document.getElementById('quote-price').textContent = `$${total.toLocaleString('es-MX')}`;
    document.getElementById('breakdown-base-label').textContent = `Base (${facturasLabels[level]})`;
    document.getElementById('breakdown-base-price').textContent = `$${basePrice.toLocaleString('es-MX')}`;

    const nominaRow = document.getElementById('breakdown-nomina-row');
    if (empleados > 0) {
        nominaRow.classList.remove('hidden');
        document.getElementById('breakdown-nomina-label').textContent = `Nómina (${empleados} emp. x $100)`;
        document.getElementById('breakdown-nomina-price').textContent = `+$${nominaCost.toLocaleString('es-MX')}`;
    } else {
        nominaRow.classList.add('hidden');
    }

    const invRow = document.getElementById('breakdown-inventarios-row');
    if (hasInventarios) {
        invRow.classList.remove('hidden');
    } else {
        invRow.classList.add('hidden');
    }

    // Construir lista dinámica de entregables según nivel y opciones
    const featuresEl = document.getElementById('included-features');
    let features = [
        'Asesoría financiera y fiscal 1:1 incluida',
        `Emisión de facturas y complementos de pago (${facturasLabels[level]})`,
        'Descarga, clasificación y conciliación de XML',
        'Cálculo y presentación puntual de impuestos mensuales (ISR / IVA)',
        'Monitoreo de Buzón Tributario y Opinión de Cumplimiento (32-D)'
    ];

    if (subRegime === 'empresarial' || subRegime === 'digitales' || personType === 'moral') {
        features.push('Presentación de DIOT y control de deducciones autorizadas');
    }
    if (level >= 2 || personType === 'moral') {
        features.push('Conciliación bancaria mensual y Balanza de Comprobación');
    }
    if (level >= 3 || personType === 'moral') {
        features.push('Estados Financieros mensuales (Estado de Resultados y Balance)');
    }
    if (level >= 4) {
        features.push('Análisis de indicadores financieros y flujo de efectivo');
    }
    if (empleados > 0) {
        features.push(`Timbrado de nómina y gestión IMSS/INFONAVIT (${empleados} emp.)`);
    }
    if (hasInventarios) {
        features.push('Evaluación personalizada para Control de Inventarios y Kardex');
    }

    featuresEl.innerHTML = features.map(item => `
        <li class="flex items-start gap-2">
            <i data-lucide="check" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>
            <span>${item}</span>
        </li>
    `).join('');

    lucide.createIcons();
}

function buildQuoteSummaryText() {
    const regimeName = pricingMatrix[subRegime].name;
    const facturas = facturasLabels[document.getElementById('facturas-range').value];
    const empleados = Number(document.getElementById('empleados-range').value);
    const total = document.getElementById('quote-price').textContent;
    const invText = document.getElementById('addon-inventarios').checked ? 'Sí (Cotización a consideración)' : 'No';

    return `Hola CP Carlos Baruch (Despacho CABHEO), me interesa cotizar este plan:\n• Régimen: ${regimeName}\n• Volumen: ${facturas} (incluye emisión y complementos)\n• Asesoría 1:1: Incluida\n• Nómina: ${empleados} empleado${empleados === 1 ? '' : 's'}\n• Control de Inventarios: ${invText}\n• Total base estimado: ${total} MXN/mes (IVA incluido)`;
}

function prefillContactAndGo() {
    document.getElementById('message').value = buildQuoteSummaryText();
    switchView('contacto');
}

function openWhatsApp(message) {
    const url = 'https://wa.me/527861198800?text=' + encodeURIComponent(message);
    window.open(url, '_blank', 'noopener,noreferrer');
}

function sendQuoteWhatsApp() {
    openWhatsApp(buildQuoteSummaryText());
}

// ==========================================
// SECCIÓN DE ANÁLISIS FISCALES Y PERFIL MAESTRO
// ==========================================
let currentBlogCategory = 'todos';

const articlesData = [
    {
        id: 1,
        category: 'basico',
        categoryLabel: 'Nivel Básico',
        badgeColor: 'bg-emerald-50 text-emerald-700',
        tag: 'Conceptos Esenciales',
        date: 'Actualizado 2026',
        title: '¿Qué es el CFDI 4.0 y qué datos debes revisar antes de pedir o emitir una factura?',
        summary: 'Guía práctica para evitar errores comunes con el Régimen Fiscal, Uso de CFDI y Código Postal que pueden hacer no deducible tu gasto.',
        rawText: 'Uno de los errores más frecuentes que consultan los clientes al iniciar su negocio es emitir o recibir facturas con datos incorrectos, lo cual impide deducir gastos o acreditar el IVA.\n\nLos 4 datos obligatorios que siempre debes validar:\n• RFC y Nombre / Razón Social exactos: Tal como aparecen en la Constancia de Situación Fiscal (en mayúsculas y sin el régimen societario).\n• Código Postal del domicilio fiscal: Debe coincidir exactamente con el registrado ante el SAT.\n• Régimen Fiscal del receptor: Por ejemplo, 626 para RESICO o 612 para Actividad Empresarial.\n• Uso de CFDI y Forma de Pago: Si pagaste de contado, debe decir PUE y el método real. Si te pagarán después, debe ser PPD y emitir posteriormente su Complemento de Pago.\n\nConsejo CABHEO: Nunca pagues en efectivo gastos mayores a $2,000 MXN si deseas deducirlos, y solicita siempre tu factura dentro del mismo mes.',
        content: `
            <p class="mb-4">Uno de los errores más frecuentes que consultan los clientes al iniciar su negocio es emitir o recibir facturas con datos incorrectos, lo cual impide deducir gastos o acreditar el IVA.</p>
            <h4 class="font-bold text-slate-900 mb-2">Los 4 datos obligatorios que siempre debes validar:</h4>
            <ul class="list-disc pl-5 space-y-2 mb-4">
                <li><strong>RFC y Nombre / Razón Social exactos:</strong> Tal como aparecen en la Constancia de Situación Fiscal (en mayúsculas y sin el régimen societario como "S.A. de C.V.").</li>
                <li><strong>Código Postal del domicilio fiscal:</strong> Debe coincidir exactamente con el registrado ante el SAT.</li>
                <li><strong>Régimen Fiscal del receptor:</strong> Por ejemplo, 626 para RESICO o 612 para Actividad Empresarial.</li>
                <li><strong>Uso de CFDI y Forma de Pago:</strong> Si pagaste de contado, debe decir <em>PUE (Pago en Una Sola Exhibición)</em> y el método real (transferencia, tarjeta). Si te pagarán después, debe ser <em>PPD</em> y emitir posteriormente su Complemento de Pago.</li>
            </ul>
            <div class="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-xl text-brand-950 text-xs">
                <strong>Consejo CABHEO:</strong> Nunca pagues en efectivo gastos mayores a $2,000 MXN si deseas deducirlos, y solicita siempre tu factura dentro del mismo mes en que realizaste la operación.
            </div>
        `
    },
    {
        id: 2,
        category: 'intermedio',
        categoryLabel: 'Actualizaciones y Regímenes',
        badgeColor: 'bg-brand-50 text-brand-800',
        tag: 'RESICO vs Act. Empresarial',
        date: 'Análisis Fiscal',
        title: 'Análisis RESICO: Ventajas de la tasa mínima de ISR y cuidados para no salir del régimen',
        summary: 'Analizamos cómo funciona el cálculo sobre flujo de efectivo efectivamente cobrado y qué obligaciones debes cumplir puntualmente para conservar el beneficio.',
        rawText: 'El Régimen Simplificado de Confianza (RESICO) permite a las Personas Físicas pagar tasas de ISR que van desde el 1.0% hasta el 2.5% sobre los ingresos efectivamente cobrados, siempre que no rebasen los 3.5 millones de pesos anuales.\n\nPuntos clave que debes vigilar cada mes:\n• El IVA sigue operando normal: Para el cálculo del IVA sí necesitas tus facturas de gastos deducibles pagados para acreditar el IVA.\n• e.firma y Buzón Tributario activos: Es requisito indispensable mantener ambos medios habilitados.\n• No omitir declaraciones: Dejar de presentar 3 o más pagos mensuales es causal de expulsión del régimen.\n\nConsejo CABHEO: Pide factura de todos tus gastos operativos indispensables; eso reduce drásticamente tu IVA a cargo cada mes.',
        content: `
            <p class="mb-4">El Régimen Simplificado de Confianza (RESICO) permite a las Personas Físicas pagar tasas de ISR que van desde el <strong>1.0% hasta el 2.5%</strong> sobre los ingresos efectivamente cobrados, siempre que no rebasen los 3.5 millones de pesos anuales.</p>
            <h4 class="font-bold text-slate-900 mb-2">Puntos clave que debes vigilar cada mes:</h4>
            <ul class="list-disc pl-5 space-y-2 mb-4">
                <li><strong>El IVA sigue operando normal:</strong> Aunque en ISR no se restan gastos, para el cálculo del IVA sí necesitas tus facturas de gastos deducibles pagados para acreditar el IVA y pagar menos impuesto.</li>
                <li><strong>e.firma y Buzón Tributario activos:</strong> Es requisito indispensable mantener ambos medios habilitados y actualizados.</li>
                <li><strong>No omitir declaraciones:</strong> Dejar de presentar 3 o más pagos mensuales o la declaración anual es causal de expulsión del régimen por parte de la autoridad.</li>
            </ul>
            <div class="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-xl text-brand-950 text-xs">
                <strong>Consejo CABHEO:</strong> Aunque tu tasa de ISR sea baja, pide factura de todos tus gastos operativos indispensables; eso reduce drásticamente tu IVA a cargo cada mes.
            </div>
        `
    },
    {
        id: 3,
        category: 'avanzado',
        categoryLabel: 'Nivel Avanzado / Finanzas',
        badgeColor: 'bg-slate-200 text-slate-800',
        tag: 'Ingeniería Financiera',
        date: 'Estrategia Empresarial',
        title: 'Punto de Equilibrio y Margen de Contribución: ¿Tu empresa realmente gana dinero o solo mueve efectivo?',
        summary: 'Cómo aplicar herramientas de ingeniería económica para fijar precios correctamente, controlar costos variables y proteger tu liquidez.',
        rawText: 'Muchos negocios tienen ventas constantes pero al final del mes no ven utilidad en su cuenta bancaria. Esto ocurre cuando se confunde el flujo de efectivo con la rentabilidad real.\n\nPasos para diagnosticar la salud financiera:\n• Separa costos fijos de variables.\n• Calcula tu Punto de Equilibrio dividiendo Costos Fijos Totales entre tu Margen de Contribución unitario.\n• Valuación de inventarios: Un inventario detenido es capital congelado.\n\nConsejo CABHEO: En nuestras sesiones 1:1 revisamos tus estados financieros para detectar fugas de margen y optimizar tus precios.',
        content: `
            <p class="mb-4">Muchos negocios tienen ventas constantes pero al final del mes no ven utilidad en su cuenta bancaria. Esto ocurre cuando se confunde el <strong>flujo de efectivo</strong> con la <strong>rentabilidad real</strong>.</p>
            <h4 class="font-bold text-slate-900 mb-2">Pasos para diagnosticar la salud financiera de tu operación:</h4>
            <ul class="list-disc pl-5 space-y-2 mb-4">
                <li><strong>Separa costos fijos de variables:</strong> Identifica cuánto te cuesta abrir la cortina cada mes (renta, sueldos base, servicios) frente a lo que cuesta producir o vender cada unidad.</li>
                <li><strong>Calcula tu Punto de Equilibrio:</strong> Divide tus Costos Fijos Totales entre tu Margen de Contribución unitario (Precio de Venta menos Costo Variable). Ese resultado te dice exactamente cuánto debes vender para no perder.</li>
                <li><strong>Valuación de inventarios:</strong> Un inventario detenido es capital congelado. Medir la rotación evita compras excesivas que asfixian tu liquidez.</li>
            </ul>
            <div class="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-xl text-brand-950 text-xs">
                <strong>Consejo CABHEO:</strong> En nuestras sesiones 1:1 revisamos tus estados financieros no solo para cumplir con el SAT, sino para detectar fugas de margen y optimizar tus precios.
            </div>
        `
    },
    {
        id: 4,
        category: 'consejos',
        categoryLabel: 'Consejos Prácticos',
        badgeColor: 'bg-amber-50 text-amber-800',
        tag: 'Prevención SAT',
        date: 'Recomendación Mensual',
        title: '5 hábitos financieros para evitar discrepancia fiscal entre tus cuentas bancarias y tus facturas',
        summary: 'El SAT cruza automáticamente tus depósitos bancarios contra los CFDI emitidos. Aprende a blindar tus movimientos personales y de negocio.',
        rawText: 'La discrepancia fiscal sucede cuando las erogaciones o depósitos en tus cuentas bancarias superan los ingresos declarados ante el SAT.\n\nRecomendaciones prácticas inmediatas:\n• No mezcles cuentas personales con las del negocio.\n• Cuidado con los traspasos entre cuentas propias: guarda siempre ambos estados de cuenta.\n• Préstamos y aportaciones: respalda siempre con contrato y transferencia bancaria.\n• Pagos de tarjetas de crédito: hazlo siempre mediante transferencia desde tu cuenta fiscalizada.\n\nConsejo CABHEO: Descarga cada mes tu Opinión de Cumplimiento (32-D) para verificar que no existan obligaciones omisas.',
        content: `
            <p class="mb-4">La discrepancia fiscal sucede cuando las erogaciones o depósitos en tus cuentas bancarias superan los ingresos declarados ante el SAT.</p>
            <h4 class="font-bold text-slate-900 mb-2">Recomendaciones prácticas inmediatas:</h4>
            <ul class="list-disc pl-5 space-y-2 mb-4">
                <li><strong>No mezcles cuentas personales con las del negocio:</strong> Utiliza una cuenta exclusiva para tu actividad económica.</li>
                <li><strong>Cuidado con los traspasos entre cuentas propias:</strong> Si mueves dinero de tu cuenta A a tu cuenta B, guarda siempre ambos estados de cuenta para demostrar que es el mismo recurso y no un ingreso nuevo.</li>
                <li><strong>Préstamos y aportaciones:</strong> Todo préstamo recibido debe estar respaldado por un contrato firmado y transferencia bancaria para no considerarse ingreso acumulable.</li>
                <li><strong>Pagos de tarjetas de crédito:</strong> Evita pagar tarjetas con efectivo; hazlo siempre mediante transferencia desde tu cuenta fiscalizada.</li>
            </ul>
            <div class="bg-brand-50 border-l-4 border-brand-500 p-4 rounded-r-xl text-brand-950 text-xs">
                <strong>Consejo CABHEO:</strong> Descarga cada mes tu Opinión de Cumplimiento (32-D) para verificar que no existan obligaciones omisas ni alertas tempranas.
            </div>
        `
    }
];

function filterArticles(category) {
    currentBlogCategory = category;
    document.querySelectorAll('.blog-filter-btn').forEach(btn => {
        if (btn.getAttribute('data-cat') === category) {
            btn.className = 'blog-filter-btn px-4 py-2 rounded-xl text-xs font-semibold bg-brand-800 text-white transition-all';
        } else {
            btn.className = 'blog-filter-btn px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all';
        }
    });
    renderArticles();
}

function renderArticles() {
    const grid = document.getElementById('articles-grid');
    const searchQuery = (document.getElementById('blog-search')?.value || '').toLowerCase();

    const filtered = articlesData.filter(art => {
        const matchesCat = currentBlogCategory === 'todos' || art.category === currentBlogCategory;
        const matchesSearch = art.title.toLowerCase().includes(searchQuery) ||
                              art.summary.toLowerCase().includes(searchQuery) ||
                              art.tag.toLowerCase().includes(searchQuery);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200">
                <p class="text-slate-500 text-sm">No se encontraron análisis con ese criterio de búsqueda.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(art => `
        <article class="bg-white rounded-3xl border border-slate-200/90 p-7 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between">
            <div>
                <div class="flex items-center justify-between gap-2 mb-4">
                    <span class="px-3 py-1 rounded-full text-[11px] font-semibold ${art.badgeColor}">
                        ${art.categoryLabel}
                    </span>
                    <span class="text-[11px] text-slate-400 font-medium">${art.tag}</span>
                </div>
                <h3 class="text-lg font-bold text-slate-900 leading-snug mb-3">
                    ${art.title}
                </h3>
                <p class="text-sm text-slate-600 leading-relaxed mb-6">
                    ${art.summary}
                </p>
            </div>
            <div>
                <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span class="text-xs text-slate-400">Por C.P. Carlos Baruch</span>
                    <button onclick="openArticle(${art.id})" class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-500 hover:text-brand-800 transition-colors">
                        Leer análisis completo
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </article>
    `).join('');

    lucide.createIcons();
}

function openArticle(id) {
    const art = articlesData.find(a => a.id === id);
    if (!art) return;

    const reader = document.getElementById('reader-content');
    reader.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
            <span class="px-3 py-1 rounded-full text-xs font-semibold ${art.badgeColor}">${art.categoryLabel}</span>
            <span class="text-xs text-slate-400">• ${art.tag}</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-3">${art.title}</h2>
        <p class="text-xs text-slate-500 mb-6 pb-4 border-b border-slate-100">
            Análisis elaborado por <strong>C.P. y M.I.E.F. Carlos Baruch Hernández Olivares</strong> • Despacho Contable CABHEO
        </p>
        <div class="text-sm text-slate-700 leading-relaxed space-y-3">
            ${art.content}
        </div>
        <div class="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span class="text-xs text-slate-600">¿Tienes dudas sobre cómo aplica este tema a tu caso?</span>
            <button onclick="closeReaderModal(); switchView('contacto');" class="bg-brand-800 hover:bg-brand-900 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors">
                Consultar con el Contador
            </button>
        </div>
    `;
    document.getElementById('article-reader-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeReaderModal() {
    document.getElementById('article-reader-modal').classList.add('hidden');
}

document.getElementById('contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const message = document.getElementById('message').value.trim();
    if (!message) {
        document.getElementById('message').focus();
        return;
    }
    openWhatsApp(name ? 'Nombre: ' + name + '\n\n' + message : message);
});

document.querySelectorAll('.faq-toggle').forEach(button => {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
        const expanded = !button.nextElementSibling.classList.toggle('hidden');
        button.setAttribute('aria-expanded', String(expanded));
    });
});

// Inicializar cotizador y artículos al cargar
calculateQuote();
renderArticles();
