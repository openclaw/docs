---
read_when:
    - Quieres abrir la interfaz de control con tu token actual
    - Quieres imprimir la URL sin abrir un navegador
summary: Referencia de la CLI para `openclaw dashboard` (abrir la interfaz de control)
title: Panel de control
x-i18n:
    generated_at: "2026-07-12T14:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 349dff4bad7fc6aa622067ed502d7d6800b93ebcfe26d2594e602e06e564993f
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Abra la interfaz de control con su autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --yes
```

- `--no-open`: muestra la URL, pero no abre un navegador.
- `--yes`: inicia/instala el Gateway sin solicitar confirmación cuando sea necesario.

Notas:

- Resuelve las SecretRefs configuradas en `gateway.auth.token` cuando es posible.
- Respeta `gateway.tls.enabled`: los gateways con TLS habilitado muestran/abren URL de la interfaz de control con `https://` y se conectan mediante `wss://`.
- Para un enlace `lan` o un enlace `custom` con comodín, los inicios en el mismo host siempre usan la interfaz de bucle invertido porque un comodín no es un destino de navegador. Los enlaces `tailnet` y `custom` de texto sin cifrar también usan `127.0.0.1` para que el navegador disponga de un contexto seguro; los hosts específicos con TLS habilitado conservan la dirección configurada para que los nombres de los certificados coincidan.
- Antes de proporcionar una URL de bucle invertido autenticada para un enlace a una interfaz específica, el comando comprueba la interfaz configurada y verifica que tanto esta como `127.0.0.1` pertenezcan al mismo proceso del Gateway. Si la propiedad del proceso de escucha es ambigua, la operación falla de forma segura y muestra indicaciones sobre el estado.
- En el caso de los tokens administrados mediante SecretRef (resueltos o sin resolver), la URL mostrada, copiada o abierta nunca incluye el token, por lo que los secretos externos no se filtran en la salida del terminal, el historial del portapapeles ni los argumentos de apertura del navegador.
- Si `gateway.auth.token` se administra mediante SecretRef, pero no se ha resuelto, el comando muestra una URL sin token e indicaciones para corregir el problema, en lugar de un marcador de posición de token no válido.
- Si falla la entrega mediante el portapapeles o el navegador de una URL autenticada con token, el comando registra una indicación segura para la autenticación manual que menciona `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` y la clave de fragmento de URL `token`, sin mostrar el valor del token.

## Relacionado

- [Referencia de la CLI](/es/cli)
- [Panel de control](/es/web/dashboard)
