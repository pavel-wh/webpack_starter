function greeter(person: string): string {
  return 'Hello, ' + person;
}

let user = 'Typescript Component';

console.log(greeter(user));

document.body.querySelector('#ts').textContent = greeter(user);
