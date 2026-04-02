const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyCJ0Gs2NI1Amj_nqBLVetWPzCIOiv8zdvME2GCdTdZOqgD4Mrat7w_fwRrrJC4tp1d/exec'; 

const mainView = document.getElementById('main-view');
const editView = document.getElementById('edit-view');
const addModal = document.getElementById('add-modal');
const tableBody = document.getElementById('table-body');

const filtroCategoria = document.getElementById('filter-category');
const filtroProducto = document.getElementById('filter-product');
const filtroFecha = document.getElementById('filter-date'); 
const addCategory = document.getElementById('add-category');
const addProduct = document.getElementById('add-product');

let currentSobranteId = null;
let accionPendiente = null;
let todosLosSobrantes = []; 

const menuProductos = {
    "Cookie": ["NUTELLA", "PISTACHO", "CHOCOLATE XL", "CHOCO Y SAL", "RED VELVET", "FRAMBUESA", "DDL Y NUTELLA", "PISTACHO Y LIMON"],
    "Alfajor": ["BARILOCHE", "MARPLATENSE", "PISTACHO", "NUEZ", "ALMENDRA", "ALFACOOKIE", "DUBAI"],
    "Budin": ["CARROT", "BANANA", "LIMON", "MANZANA"],
    "Tortas": ["CHEESECAKE FRUTOS ROJOS", "CHEESECAKE PISTACHO", "CHEESECAKE MANZANA", "TARTA PISTACHO", "KEY LIME", "BROWNIE NEGRO", "BROWNIE BLANCO"],
    "Laminados": ["MEDIALUNA ( DOC)", "CROISSANT (UNI)", "ROLL DE QUESO", "ROLL CANELA", "PAN CHOCOLATE", "SCONS", "DANESA", "FOSFORITO DDL", "TORTITA NEGRA", "TRENZA DDL"],
    "Panificados": ["CHIPA", "CIABATTA", "BRIOCHE", "MASA MADRE", "PAN BLANCO", "PAN CON SEMILLAS", "PAN INTEGRAL", "PAN HAMBURGUESA"],
    "Cafe": ["CAFÉ (KG)", "EDULCORANTE"],
    "Varios": ["ACEITE DE OLIVA unidad", "JAMON kilo", "QUESO TYBO kilo", "PALTA PURE unidad", "MAPLE HUEVO"]
};

async function cargarDatos() {
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando inventario...</td></tr>';
    try {
        const respuesta = await fetch(GOOGLE_SCRIPT_URL);
        todosLosSobrantes = await respuesta.json(); 
        aplicarFiltros(); 
    } catch (error) {
        console.error("Error al cargar:", error);
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color: red;">Error de conexión con la base de datos.</td></tr>';
    }
}

function init() {
    cargarCategorias();
    cargarDatos();
}

function cargarCategorias() {
    const categorias = Object.keys(menuProductos);
    categorias.forEach(cat => {
        filtroCategoria.innerHTML += `<option value="${cat}">${cat}</option>`;
        addCategory.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function actualizarProductos(categoriaSelect, productoSelect, opcionPorDefecto) {
    const categoriaElegida = categoriaSelect.value;
    productoSelect.innerHTML = `<option value="">${opcionPorDefecto}</option>`;
    
    if (categoriaElegida && menuProductos[categoriaElegida]) {
        menuProductos[categoriaElegida].forEach(prod => {
            productoSelect.innerHTML += `<option value="${prod}">${prod}</option>`;
        });
    }
}

filtroCategoria.addEventListener('change', () => {
    actualizarProductos(filtroCategoria, filtroProducto, 'Todos');
    aplicarFiltros(); 
});

addCategory.addEventListener('change', () => actualizarProductos(addCategory, addProduct, 'Selecciona un producto...'));


function aplicarFiltros() {
    const cat = filtroCategoria.value;
    const prod = filtroProducto.value;
    const fechaFiltro = filtroFecha.value; 

    const filtrados = todosLosSobrantes.filter(item => {
        let pasaCat = (cat === "" || item.categoria === cat);
        let pasaProd = (prod === "" || item.producto === prod);
        let pasaFecha = true;

        if (fechaFiltro) {
            let itemDateStr = "";
            if (item.fecha.includes("T")) {
                itemDateStr = item.fecha.split("T")[0];
            } else if (item.fecha.includes("/")) {
                let parts = item.fecha.split(" ")[0].split("/"); 
                if(parts.length === 3) {
                    itemDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; 
                }
            }
            pasaFecha = (itemDateStr === fechaFiltro);
        }

        return pasaCat && pasaProd && pasaFecha;
    });

    renderTable(filtrados);
}

filtroProducto.addEventListener('change', aplicarFiltros);
filtroFecha.addEventListener('change', aplicarFiltros);


document.getElementById('btn-show-all').onclick = () => {
    filtroCategoria.value = "";
    actualizarProductos(filtroCategoria, filtroProducto, 'Todos');
    filtroFecha.value = "";
    aplicarFiltros();
};

function renderTable(data) {
    tableBody.innerHTML = '';
    if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay sobrantes pendientes para esta búsqueda</td></tr>';
        return;
    }
    data.forEach(item => {
        let fechaLimpia = item.fecha;
        if (typeof fechaLimpia === 'string' && fechaLimpia.includes('T')) {
            const d = new Date(fechaLimpia);
            if(!isNaN(d)) {
                const dia = String(d.getDate()).padStart(2, '0');
                const mes = String(d.getMonth() + 1).padStart(2, '0');
                const anio = d.getFullYear();
                const hora = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                fechaLimpia = `${dia}/${mes}/${anio} ${hora}:${min}`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${fechaLimpia}</td>
            <td>${item.producto}</td>
            <td>${item.total}</td>
            <td>${item.desechado}</td>
            <td>${item.reutilizado}</td>
            <td><strong>${item.pendiente}</strong></td>
        `;
        tr.onclick = () => openEditView(item);
        tableBody.appendChild(tr);
    });
}

document.getElementById('btn-back').onclick = () => {
    editView.classList.add('hidden');
    mainView.classList.remove('hidden');
};

document.getElementById('btn-add-modal').onclick = () => {
    addCategory.value = filtroCategoria.value;
    actualizarProductos(addCategory, addProduct, 'Selecciona un producto...');
    addProduct.value = filtroProducto.value;
    addModal.classList.remove('hidden');
};

document.getElementById('btn-cancel-add').onclick = () => addModal.classList.add('hidden');

function openEditView(item) {
    currentSobranteId = item.id;
    document.getElementById('edit-product-name').innerText = item.producto;
    
    document.getElementById('edit-total').innerText = item.total;
    document.getElementById('edit-pending').innerText = item.pendiente;
    
    document.getElementById('edit-reused-amount').innerText = item.reutilizado;
    document.getElementById('edit-discard-amount').innerText = item.desechado;
    
    document.getElementById('reuse-comment').value = '';
    document.getElementById('reuse-amount').value = '';
    document.getElementById('discard-comment').value = '';
    document.getElementById('discard-amount').value = '';

    document.getElementById('reuse-reason-select').selectedIndex = 0;
    document.getElementById('discard-reason-select').selectedIndex = 0;

    mainView.classList.add('hidden');
    editView.classList.remove('hidden');
}

document.getElementById('btn-save-add').onclick = async () => {
    const data = {
        action: 'add',
        categoria: addCategory.value,
        producto: addProduct.value,
        total: document.getElementById('add-total').value,
        motivo: document.getElementById('add-reason').value || 'Ingreso de turno' 
    };
    
    if(!data.producto || !data.total || data.total <= 0) return alert("Completa los datos correctamente");

    document.getElementById('btn-save-add').innerText = "Guardando...";
    
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        addModal.classList.add('hidden');
        document.getElementById('add-total').value = ''; 
        document.getElementById('add-reason').value = ''; 
        cargarDatos(); 
    } catch (e) {
        alert("Error al guardar. Verifica la URL de Google Script.");
    } finally {
        document.getElementById('btn-save-add').innerText = "Guardar";
    }
};

function pedirConfirmacion(tipo) {
    const amountId = tipo === 'reutilizar' ? 'reuse-amount' : 'discard-amount';
    const reasonSelectId = tipo === 'reutilizar' ? 'reuse-reason-select' : 'discard-reason-select';
    const commentId = tipo === 'reutilizar' ? 'reuse-comment' : 'discard-comment';
    
    const cantidad = document.getElementById(amountId).value;
    const selectValor = document.getElementById(reasonSelectId).value;
    const comentario = document.getElementById(commentId).value;

    if(!cantidad || cantidad <= 0) return alert('Ingresa una cantidad válida mayor a 0');

    const maxPendiente = parseInt(document.getElementById('edit-pending').innerText);
    if(parseInt(cantidad) > maxPendiente) {
        return alert(`¡Error! Estás intentando cargar ${cantidad}, pero solo quedan ${maxPendiente} pendientes.`);
    }

    const motivoFinal = comentario.trim() !== '' ? `${selectValor} - ${comentario}` : selectValor;

    accionPendiente = { tipo: tipo, cantidad: cantidad, motivoFinal: motivoFinal };
    
    const accionTexto = tipo === 'reutilizar' ? 'Reutilizar' : 'Desechar';
    document.getElementById('confirm-title').innerText = `¿${accionTexto} productos?`;
    document.getElementById('confirm-message').innerHTML = `
        Vas a <b>${accionTexto} ${cantidad}</b> unidades.<br>
        <span style="font-size: 15px; color: gray;">Motivo: ${motivoFinal}</span>
    `;

    document.getElementById('confirm-modal').classList.remove('hidden');
}

document.getElementById('btn-cancel-confirm').onclick = () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    accionPendiente = null;
};

document.getElementById('btn-accept-confirm').onclick = () => {
    document.getElementById('confirm-modal').classList.add('hidden');
    if(accionPendiente) {
        guardarEdicionDefinitiva(accionPendiente.tipo, accionPendiente.cantidad, accionPendiente.motivoFinal);
    }
};

async function guardarEdicionDefinitiva(tipo, cantidad, motivo) {
    const data = {
        action: 'update',
        id: currentSobranteId,
        tipo: tipo,
        cantidad: cantidad,
        motivo: motivo
    };

    const botonCambiado = tipo === 'reutilizar' ? '.btn-reuse' : '.btn-discard';
    const textoOriginal = document.querySelector(botonCambiado).innerText;
    document.querySelector(botonCambiado).innerText = "Guardando...";

    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        document.getElementById('btn-back').click(); 
        cargarDatos(); 
    } catch (error) {
        alert("Hubo un error al guardar. Revisa la conexión.");
    } finally {
        document.querySelector(botonCambiado).innerText = textoOriginal;
        accionPendiente = null;
    }
}

// Arrancar la app
init();