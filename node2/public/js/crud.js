async function deleteFunction(id) {
  let _id = id;
  let result = confirm("Are you want to delete");
  if(result == true){
      var response = await fetch(`/restaurants/${_id}`, {
        method:'delete',
        headers: {"Content-Type": "multipart/form-data"}
      }).then(response => {
        alert("Successful delete");
        if (response.redirected) {
            window.location.href = response.url;
        }
      });
  }
};
