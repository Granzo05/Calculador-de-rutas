import Toastify from 'toastify-js';

document.getElementById('agregar-usuario')?.addEventListener('click', async () => {
  const userElement = document.getElementById('user') as HTMLInputElement;
  const passwordElement = document.getElementById('password') as HTMLInputElement;
  const rolElement = document.getElementById('rol') as HTMLInputElement;

  const user = userElement.value;
  const password = passwordElement.value;
  const rol = rolElement.value;

  const showToast = (message: string) => {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "#ff0000",
    }).showToast();
  };

  if (user.length === 0) {
    showToast('Necesita ingresar un usuario válido');
    userElement.focus();
    return;
  } else if (password.length < 8) {
    showToast('Necesita ingresar una contraseña de 8 caracteres o más');
    passwordElement.focus();
    return;
  } else if (rol.length === 0) {
    showToast('Necesita seleccionar un rol');
    rolElement.focus();
    return;
  }

  const query = `SELECT * FROM usuario WHERE usuario = '${user}'`;

  try {
    const result: any = await window.electronAPI.selectDatabase(query);

    if (result.error) {
      console.error('Error en la consulta:', result.error);
      showToast(`Error en la consulta: ${result.error}`);
      return;
    } else {
      if (result.rows && result.rows.length > 0) {
        showToast('Hay un usuario cargado con ese nombre');
        userElement.focus();
        return;
      }
    }
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    showToast(`Error al realizar la consulta: ${error}`);
    return;
  }


  const hashedPassword = await window.argon.hashPassword(password);

  const insertQuery = `INSERT INTO usuario (usuario, contraseña, rol) VALUES ('${user}', '${hashedPassword}', '${rol}')`;

  try {
    const result: any = await window.electronAPI.insertDatabase(insertQuery);
    if (result.error) {
      console.error('Error en la consulta:', result.error);
      showToast(`Error en la consulta: ${result.error}`);
    } else {
      showToast('Usuario cargado con éxito');
      console.log('Inserción exitosa:', result);
    }
  } catch (error) {
    console.error('Error al realizar la consulta:', error);
    showToast(`Error al realizar la consulta: ${error}`);
  }
});
