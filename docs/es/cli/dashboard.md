---
read_when:
    - Quieres abrir la interfaz de control con tu token actual
    - Se desea mostrar la URL sin abrir un navegador
summary: Referencia de la CLI para `openclaw dashboard` (abrir la interfaz de control)
title: Panel de control
x-i18n:
    generated_at: "2026-07-14T13:34:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 25
    provider: openai
    source_hash: 168605e1e58827020b4d247afd513880335273e489995549377bc2dc1f8a3b25
    source_path: cli/dashboard.md
    workflow: 16
---

# `openclaw dashboard`

Abra la interfaz de control con la autenticación actual.

```bash
openclaw dashboard
openclaw dashboard --no-open
openclaw dashboard --json
openclaw dashboard --yes
```

- `--no-open`: muestra la URL, pero no inicia un navegador.
- `--json`: muestra un objeto de conexión legible por máquina sin abrir un navegador, usar el portapapeles, solicitar confirmación ni iniciar el Gateway.
- `--yes`: inicia o instala el Gateway sin solicitar confirmación cuando sea necesario.

## Salida legible por máquina

Use `--json` para integraciones de escritorio y scripts que necesiten la URL resuelta de la interfaz de control:

```bash
openclaw dashboard --json
```

La respuesta incluye `url`, `httpUrl`, `wsUrl`, `port` y `tokenIncluded`. Si el Gateway no está listo, el comando devuelve `{"ok":false,"reason":"..."}` y finaliza con un código distinto de cero. Los tokens administrados mediante SecretRef nunca se incluyen en `url`.

Notas:

- Resuelve las SecretRefs configuradas en `gateway.auth.token` cuando es posible.
- Respeta `gateway.tls.enabled`: los gateways con TLS habilitado muestran o abren URL de la interfaz de control con `https://` y se conectan mediante `wss://`.
- Para `lan` o una vinculación comodín `custom`, los inicios en el mismo host siempre usan la interfaz de bucle invertido porque un comodín no es un destino de navegador. Las vinculaciones de texto sin cifrar `tailnet` y `custom` también usan `127.0.0.1` para que el navegador disponga de un contexto seguro; los hosts específicos con TLS habilitado mantienen la dirección configurada para que coincidan los nombres de los certificados.
- Antes de proporcionar una URL de bucle invertido autenticada para una vinculación a una interfaz específica, el comando sondea la interfaz configurada y verifica que tanto esta como `127.0.0.1` pertenezcan al mismo proceso de Gateway. Si la propiedad del proceso de escucha es ambigua, el comando aplica un cierre seguro y proporciona orientación sobre el estado.
- Para los tokens administrados mediante SecretRef, estén resueltos o no, la URL mostrada, copiada o abierta nunca incluye el token, por lo que los secretos externos no se filtran en la salida del terminal, el historial del portapapeles ni los argumentos de inicio del navegador.
- Si `gateway.auth.token` está administrado mediante SecretRef pero no se ha resuelto, el comando muestra una URL sin token e indicaciones para solucionar el problema en lugar de un marcador de posición de token no válido.
- Si falla la entrega mediante el portapapeles o el navegador de una URL autenticada con token, el comando registra una indicación segura para la autenticación manual que menciona `OPENCLAW_GATEWAY_TOKEN`, `gateway.auth.token` y la clave de fragmento de URL `token`, sin mostrar el valor del token.

## Contenido relacionado

- [Referencia de la CLI](/es/cli)
- [Panel de control](/es/web/dashboard)
