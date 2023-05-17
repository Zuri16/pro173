var tableNumber = null;

AFRAME.registerComponent("markerhandler", {
  init: async function () {
    
    if (tableNumber === null) {
      this.askTableNumber();
    }

    var dishes = await this.getDishes();

    this.el.addEventListener("markerFound", () => {
      
      if (tableNumber !== null) {
        var markerId = this.el.id;
        this.handleMarkerFound(dishes, markerId);
      }
    });
    
    this.el.addEventListener("markerLost", () => {
      this.handleMarkerLost();
    });
  },

  askTableNumber: function () {
    var iconUrl = "https://raw.githubusercontent.com/whitehatjr/menu-card-app/main/hunger.png";
    swal({
      title: "¡Bienvenido a la tienda!",
      icon: iconUrl,
      content: {
        element: "input",
        attributes: {
          placeholder: "Escribe el número de usuario",
          type: "number",
          min: 1
        }
      },
 
      closeOnClickOutside: false,
      
    }).then(inputValue => {
      tableNumber = inputValue;
    });
  },

  handleMarkerFound: function (dishes, markerId) {
   
    var todaysDate = new Date();
    var todaysDay = todaysDate.getDay();

    var days = [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado"
    ];

    var dish = dishes.filter(dish => dish.id === markerId)[0];

    if (!dish.unavailable_days.includes(days[todaysDay])) {
      swal({
        icon: "warning",
        title: dish.nombre.toUpperCase(),
        text: "¡Este juguete no está disponible hoy!",
        timer: 2500,
        buttons: false
      });
    } else {
     
      var model = document.querySelector(`#model-${dish.id}`);
      model.setAttribute("position", dish.model_geometry.position);
      model.setAttribute("rotation", dish.model_geometry.rotation);

      model.setAttribute("scale", dish.model_geometry.scale);
      
      model.setAttribute("visible", true);

      var ingredientsContainer = document.querySelector(`#main-plane-${dish.id}`);
      ingredientsContainer.setAttribute("visible", true);

      var priceplane = document.querySelector(`#price-plane-${dish.id}`);
      priceplane.setAttribute("visible", true)

      var ratingplane = document.querySelector(`#rating-plane-${dish.id}`);
      ratingplane.setAttribute("visible", true)

      var reviewplane = document.querySelector(`#review-plane-${dish.id}`);
      reviewplane.setAttribute("visible", true)

      var buttonDiv = document.getElementById("button-div");
      buttonDiv.style.display = "flex";
      
      var ratingButton = document.getElementById("rating-button");
      var orderButtton = document.getElementById("order-button");
      var orderSummaryButtton = document.getElementById("order-summary-button");
      var payButton = document.getElementById("pay-button");


      if (tableNumber != null) {

        //1.-MODIFICAR LA ESCUCHA DE EVENTOS PARA MANDAR LLAMAR A LA FUNCIÓN
        ratingButton.addEventListener("click", () => this.handleRatings(dish));

        orderButtton.addEventListener("click", () => {
       
          var tNumber;
          
          tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;
       
          this.handleOrder(tNumber, dish);
          
          swal({
            icon: "https://i.imgur.com/4NZ6uLY.jpg",
            title: "¡Gracias por tu orden!",
            text: "¡Recibirás tu juguete pronto!",
            timer: 2000,
            buttons: false
          });
        });
        
        orderSummaryButtton.addEventListener("click", () =>
        this.handleOrderSummary()
      );

        payButton.addEventListener("click", () => this.handlePayment());

      }
    }
  },
 
  handleOrder: function (tNumber, dish) {
    
    firebase
      .firestore()
      .collection("tables")
      .doc(tNumber)
      .get()
      .then(doc => {
        var details = doc.data();


        if (details["current_orders"][dish.id]) {
       
          details["current_orders"][dish.id]["quantity"] += 1;

          var currentQuantity = details["current_orders"][dish.id]["quantity"];

          details["current_orders"][dish.id]["subtotal"] =
            currentQuantity * dish.price;
        } 
        else {
          details["current_orders"][dish.id] = {
            item: dish.nombre,
            price: dish.price,
            quantity: 1,
            subtotal: dish.price * 1
          };
        }
        details.total_bill += dish.price;
        firebase
          .firestore()
          .collection("users")
          .doc(doc.id)
          .update(details);
      });
  },
 
  getDishes: async function () {
    return await firebase
      .firestore()
      .collection("toys")
      .get()
      .then(snap => {
        return snap.docs.map(doc => doc.data());
      });
  },

  getOrderSummary: async function (tNumber) {
    return await firebase
      .firestore()
      .collection("users")
      .doc(tNumber)
      .get()
      .then(doc => doc.data());
  },

  handleOrderSummary: async function () {

    //Obtener el número de mesa
    var tNumber;
    tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;

    //Obtener el resumen del pedido de la base de datos
    var orderSummary = await this.getOrderSummary(tNumber);

    //Cambiar la visibilidad del div modal
    var modalDiv = document.getElementById("modal-div");
    modalDiv.style.display = "flex";

    //Obtener el elemento cuerpo de la tabla
    var tableBodyTag = document.getElementById("bill-table-body");

    //Eliminar datos antiguos de tr(fila de la tabla)
    tableBodyTag.innerHTML = "";

    //Obtener todo lo que tiene el campo current_orders de la mesa elegida
    var currentOrders = Object.keys(orderSummary.current_orders);

    currentOrders.map(i => {

      //Crear la fila de la tabla
      var tr = document.createElement("tr");

      //Crear las columnas de la tabla para NOMBRE DEL ARTÍCULO, PRECIO, CANTIDAD y PRECIO TOTAL
      var item = document.createElement("td");
      var price = document.createElement("td");
      var quantity = document.createElement("td");
      var subtotal = document.createElement("td");

      //Añadir el contenido HTML a las celdas, usando la función innerHTML
      item.innerHTML = orderSummary.current_orders[i].item;

      price.innerHTML = "$" + orderSummary.current_orders[i].price;
      price.setAttribute("class", "text-center");

      quantity.innerHTML = orderSummary.current_orders[i].quantity;
      quantity.setAttribute("class", "text-center");

      subtotal.innerHTML = "$" + orderSummary.current_orders[i].subtotal;
      subtotal.setAttribute("class", "text-center");

      //Añadir las celdas a la fila
      tr.appendChild(item);
      tr.appendChild(price);
      tr.appendChild(quantity);
      tr.appendChild(subtotal);

      //Añadir la fila a la tabla
      tableBodyTag.appendChild(tr);

    //ACTIVIDAD DEL ALUMNO 
    //Crear una fila para el precio total
    var totalTr = document.createElement("tr");

    //Crear una celda vacía (para no tener datos)
    var td1 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    //Crear una celda vacía (para no tener datos))
    var td2 = document.createElement("td");
    td1.setAttribute("class", "no-line");

    //Crear una celda para el texto que dice TOTAL
    var td3 = document.createElement("td");
    td1.setAttribute("class", "no-line text-center");

    //Crear un elemento <strong> para poner en negritas el texto
    var strongTag = document.createElement("strong");
    strongTag.innerHTML = "Total";
    
    //Se agrega el texto a la celda
    td3.appendChild(strongTag);

    //Crear una celda para mostrar el importe total de la factura
    var td4 = document.createElement("td");
    td1.setAttribute("class", "no-line text-right");
    td4.innerHTML = "$" + orderSummary.total_bill;

    //Añadir celdas a la fila
    totalTr.appendChild(td1);
    totalTr.appendChild(td2);
    totalTr.appendChild(td3);
    totalTr.appendChild(td4);

    //Añadir la fila a la tabla
    tableBodyTag.appendChild(totalTr);
    });
  },

  handlePayment: function () {
    // Cerrar el modal
    document.getElementById("modal-div").style.display = "none";

    // Obtener el número de la mesa
    var tNumber;
    tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;

    //Restablecer los detalles de nuevo vacíos y la cuenta total en 0
    firebase
      .firestore()
      .collection("users")
      .doc(tNumber)
      .update({
        current_orders: {},
        total_bill: 0
      })
      .then(() => {
        swal({
          icon: "success",
          title: "¡Gracias por su compra!",
          text: "¡¡Esperamos que haya disfrutado de su compra!!",
          timer: 2500,
          buttons: false
        });
      });
  },

//2.-FUNCIÓN PARA ADMINISTRAR LA CALIFICACIÓN
  handleRatings: async function (dish) {

    // Obtener el número de mesa
    var tNumber;
    tableNumber <= 9 ? (tNumber = `U0${tableNumber}`) : `U${tableNumber}`;
    
    // Obtener el resumen de la orden desde la base de datos
    var orderSummary = await this.getOrderSummary(tNumber);
    
    //Guardar solo el campo current orders
    var orders = Object.keys(orderSummary.current_orders)
   
    //Checar si hay algo guardado en el campo y si esta el id del platillo que se desea calificar
    if(orders.length > 0 && orders == dish.id){
      
      // Cerrar el modal
      //ver si 329 poner en comentarios o dejar o quitar
      document.getElementById("rating-modal-div").style.display = "flex";
      document.getElementById("rating-input").value="0"
      document.getElementById("feedback-input").value=""

      // Evento de clic del botón de envio
      var envio_boton = document.getElementById("save-rating-button")
      envio_boton.addEventListener("click", ()=>{
         document.getElementById("rating-modal-div").style.display = "none";
         // Obtener los valores de entrada (reseña y calificación)
         var rating = document.getElementById("rating-input").value
         var feedback = document.getElementById("feedback-input").value
         // Actualizar la base de datos
         firebase
         .firestore()
         .collection("toys")
         .doc(dish.id)
         .update({
          last_review:feedback,
          last_rating:rating
         })
         .then(()=>{
          swal({
            icon: "success",
            title: "¡Gracias por calificarnos!",
            text: "¡¡Vuelva pronto!!",
            timer: 2500,
            buttons: false
          });
         })
      })     
    }
    else{
      swal({
        icon: "warning",
        title: "¡Ups!",
        text: "No se encontro el juguete",
        timer: 2500,
        buttons: false
      });
    }

  },

  handleMarkerLost: function () {
    // Cambiar la visibilidad del botón div
    var buttonDiv = document.getElementById("button-div");
    buttonDiv.style.display = "none";
  }
});
