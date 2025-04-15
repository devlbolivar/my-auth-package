# my-auth-package

A flexible and decoupled authentication package for React applications. Provides ready-to-use authentication components, context, and API utilities.

## Features

- 🔒 Complete authentication flow (login, register, password reset, email verification)
- 🔌 Fully configurable endpoints and base URL
- 🎨 Customizable UI components
- 📦 TypeScript support
- 🛠️ Various token storage options (localStorage, sessionStorage, etc.)
- 🔄 Token refresh handling

## Installation

```bash
npm install my-auth-package
# or
yarn add my-auth-package
```

## Quick Start

1. Configure the authentication service:

```jsx
import { configureAuth } from 'my-auth-package';

configureAuth({
  baseUrl: 'https://api.myapp.com',
  tokenStorage: 'localStorage',
  // Optionally override default endpoints
  endpoints: {
    login: '/custom/login',
    // ...
  },
});
```

2. Wrap your application with the `AuthProvider`:

```jsx
import { AuthProvider } from 'my-auth-package';

function App() {
  return (
    <AuthProvider
      onLoginSuccess={user => console.log('Logged in:', user)}
      onLogoutSuccess={() => console.log('Logged out')}
    >
      <YourApplication />
    </AuthProvider>
  );
}
```

3. Use the authentication components in your app:

```jsx
import { LoginForm, RegisterForm, PasswordReset } from 'my-auth-package';

function AuthPage() {
  const [view, setView] = useState('login');

  return (
    <div>
      {view === 'login' && (
        <LoginForm
          onSuccess={() => console.log('Login successful')}
          onError={error => console.error('Login failed:', error)}
        />
      )}

      {view === 'register' && (
        <RegisterForm
          onSuccess={() => console.log('Registration successful')}
        />
      )}

      {view === 'reset' && (
        <PasswordReset onSuccess={() => console.log('Reset email sent')} />
      )}
    </div>
  );
}
```

4. Use the auth hook to access authentication state and methods:

```jsx
import { useAuth } from 'my-auth-package';

function UserProfile() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={logout}>Log out</button>
    </div>
  );
}
```

## API Reference

### Components

- `<AuthProvider>` - Main provider for authentication context
- `<LoginForm>` - Pre-built login form component
- `<RegisterForm>` - Pre-built registration form component
- `<PasswordReset>` - Password reset form component
- `<VerificationPrompt>` - Email verification component

### Hooks

- `useAuth()` - Hook to access authentication context

### Configuration

```typescript
configureAuth({
  baseUrl: string;
  endpoints?: {
    login: string;
    register: string;
    logout: string;
    refresh: string;
    passwordReset: string;
    verifyEmail: string;
  };
  tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';
})
```

## Customization

You can customize the components by styling them directly or creating your own components using the `useAuth` hook:

```jsx
import { useAuth } from 'my-auth-package';

function CustomLoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login({ email, password });
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return <form onSubmit={handleSubmit}>{/* Your custom form elements */}</form>;
}
```

## License

MIT

# TSDX React User Guide

Congrats! You just saved yourself hours of work by bootstrapping this project with TSDX. Let's get you oriented with what's here and how to use it.

> This TSDX setup is meant for developing React component libraries (not apps!) that can be published to NPM. If you're looking to build a React-based app, you should use `create-react-app`, `razzle`, `nextjs`, `gatsby`, or `react-static`.

> If you're new to TypeScript and React, checkout [this handy cheatsheet](https://github.com/sw-yx/react-typescript-cheatsheet/)

## Commands

TSDX scaffolds your new library inside `/src`, and also sets up a [Parcel-based](https://parceljs.org) playground for it inside `/example`.

The recommended workflow is to run TSDX in one terminal:

```bash
npm start # or yarn start
```

This builds to `/dist` and runs the project in watch mode so any edits you save inside `src` causes a rebuild to `/dist`.

Then run the example inside another:

```bash
cd example
npm i # or yarn to install dependencies
npm start # or yarn start
```

The default example imports and live reloads whatever is in `/dist`, so if you are seeing an out of date component, make sure TSDX is running in watch mode like we recommend above. **No symlinking required**, we use [Parcel's aliasing](https://parceljs.org/module_resolution.html#aliases).

To do a one-off build, use `npm run build` or `yarn build`.

To run tests, use `npm test` or `yarn test`.

## Configuration

Code quality is set up for you with `prettier`, `husky`, and `lint-staged`. Adjust the respective fields in `package.json` accordingly.

### Jest

Jest tests are set up to run with `npm test` or `yarn test`.

### Bundle analysis

Calculates the real cost of your library using [size-limit](https://github.com/ai/size-limit) with `npm run size` and visulize it with `npm run analyze`.

#### Setup Files

This is the folder structure we set up for you:

```txt
/example
  index.html
  index.tsx       # test your component here in a demo app
  package.json
  tsconfig.json
/src
  index.tsx       # EDIT THIS
/test
  blah.test.tsx   # EDIT THIS
.gitignore
package.json
README.md         # EDIT THIS
tsconfig.json
```

#### React Testing Library

We do not set up `react-testing-library` for you yet, we welcome contributions and documentation on this.

### Rollup

TSDX uses [Rollup](https://rollupjs.org) as a bundler and generates multiple rollup configs for various module formats and build settings. See [Optimizations](#optimizations) for details.

### TypeScript

`tsconfig.json` is set up to interpret `dom` and `esnext` types, as well as `react` for `jsx`. Adjust according to your needs.

## Continuous Integration

### GitHub Actions

Two actions are added by default:

- `main` which installs deps w/ cache, lints, tests, and builds on all pushes against a Node and OS matrix
- `size` which comments cost comparison of your library on every pull request using [`size-limit`](https://github.com/ai/size-limit)

## Optimizations

Please see the main `tsdx` [optimizations docs](https://github.com/palmerhq/tsdx#optimizations). In particular, know that you can take advantage of development-only optimizations:

```js
// ./types/index.d.ts
declare var __DEV__: boolean;

// inside your code...
if (__DEV__) {
  console.log('foo');
}
```

You can also choose to install and use [invariant](https://github.com/palmerhq/tsdx#invariant) and [warning](https://github.com/palmerhq/tsdx#warning) functions.

## Module Formats

CJS, ESModules, and UMD module formats are supported.

The appropriate paths are configured in `package.json` and `dist/index.js` accordingly. Please report if any issues are found.

## Deploying the Example Playground

The Playground is just a simple [Parcel](https://parceljs.org) app, you can deploy it anywhere you would normally deploy that. Here are some guidelines for **manually** deploying with the Netlify CLI (`npm i -g netlify-cli`):

```bash
cd example # if not already in the example folder
npm run build # builds to dist
netlify deploy # deploy the dist folder
```

Alternatively, if you already have a git repo connected, you can set up continuous deployment with Netlify:

```bash
netlify init
# build command: yarn build && cd example && yarn && yarn build
# directory to deploy: example/dist
# pick yes for netlify.toml
```

## Named Exports

Per Palmer Group guidelines, [always use named exports.](https://github.com/palmerhq/typescript#exports) Code split inside your React app instead of your React library.

## Including Styles

There are many ways to ship styles, including with CSS-in-JS. TSDX has no opinion on this, configure how you like.

For vanilla CSS, you can include it at the root directory and add it to the `files` section in your `package.json`, so that it can be imported separately by your users and run through their bundler's loader.

## Publishing to NPM

We recommend using [np](https://github.com/sindresorhus/np).

## Usage with Lerna

When creating a new package with TSDX within a project set up with Lerna, you might encounter a `Cannot resolve dependency` error when trying to run the `example` project. To fix that you will need to make changes to the `package.json` file _inside the `example` directory_.

The problem is that due to the nature of how dependencies are installed in Lerna projects, the aliases in the example project's `package.json` might not point to the right place, as those dependencies might have been installed in the root of your Lerna project.

Change the `alias` to point to where those packages are actually installed. This depends on the directory structure of your Lerna project, so the actual path might be different from the diff below.

```diff
   "alias": {
-    "react": "../node_modules/react",
-    "react-dom": "../node_modules/react-dom"
+    "react": "../../../node_modules/react",
+    "react-dom": "../../../node_modules/react-dom"
   },
```

An alternative to fixing this problem would be to remove aliases altogether and define the dependencies referenced as aliases as dev dependencies instead. [However, that might cause other problems.](https://github.com/palmerhq/tsdx/issues/64)
