export const request = (opt) =>
  new Promise((resolve, reject) => {
    let { url, method = "get", body = null } = opt;
    const xhr = new XMLHttpRequest();
    xhr.open(method.toUpperCase(), url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE) {
        if (xhr.status >= 200 && xhr.status < 400) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(xhr.responseText);
        }
      }
    };
    xhr.send(body);
  });
