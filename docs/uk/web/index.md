---
read_when:
    - Ви хочете отримати доступ до Gateway через Tailscale
    - Вам потрібні браузерний інтерфейс керування та редагування конфігурації
summary: 'Вебінтерфейси Gateway: інтерфейс керування, режими прив’язки та безпека'
title: Вебсайт
x-i18n:
    generated_at: "2026-07-12T13:55:55Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 413fb029d95241f5c6043b28825727cdee52b2fa8cbe998fbbd6e3ff7b81467b
    source_path: web/index.md
    workflow: 16
---

Gateway обслуговує невеликий **браузерний інтерфейс керування** (Vite + Lit) через той самий порт, що й WebSocket Gateway:

- типово: `http://<host>:18789/`
- з `gateway.tls.enabled: true`: `https://<host>:18789/`
- необов’язковий префікс: задайте `gateway.controlUi.basePath` (наприклад, `/openclaw`)

Можливості описано в розділі [Інтерфейс керування](/uk/web/control-ui). На цій сторінці розглянуто режими прив’язки, безпеку та інші вебінтерфейси.

## Конфігурація (увімкнено типово)

Інтерфейс керування **увімкнено типово**, коли наявні ресурси (`dist/control-ui`):

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath необов’язковий
  },
}
```

## Webhook-и

Коли `hooks.enabled=true`, Gateway також надає кінцеву точку Webhook на тому самому HTTP-сервері. Відомості про автентифікацію і корисні навантаження див. в описі `hooks` у [довіднику з конфігурації Gateway](/uk/gateway/configuration-reference#hooks).

## Адміністративний HTTP RPC

`POST /api/v1/admin/rpc` надає вибрані методи площини керування Gateway через HTTP. Типово вимкнено; реєструється лише тоді, коли ввімкнено plugin `admin-http-rpc`. Модель автентифікації, дозволені методи та порівняння з API WebSocket див. в розділі [Адміністративний HTTP RPC](/uk/plugins/admin-http-rpc).

## Доступ через Tailscale

<Tabs>
  <Tab title="Інтегрований Serve (рекомендовано)">
    Залиште Gateway на local loopback і дозвольте Tailscale Serve проксіювати його:

    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "serve" },
      },
    }
    ```

    Запустіть Gateway:

    ```bash
    openclaw gateway
    ```

    Відкрийте `https://<magicdns>/` (або налаштований вами `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Прив’язка до tailnet + токен">
    ```json5
    {
      gateway: {
        bind: "tailnet",
        controlUi: { enabled: true },
        auth: { mode: "token", token: "your-token" },
      },
    }
    ```

    Запустіть Gateway (у цьому прикладі без local loopback використовується автентифікація за токеном зі спільним секретом):

    ```bash
    openclaw gateway
    ```

    Відкрийте `http://<tailscale-ip>:18789/` (або налаштований вами `gateway.controlUi.basePath`).

  </Tab>
  <Tab title="Загальнодоступний інтернет (Funnel)">
    ```json5
    {
      gateway: {
        bind: "loopback",
        tailscale: { mode: "funnel" },
        auth: { mode: "password" }, // або OPENCLAW_GATEWAY_PASSWORD
      },
    }
    ```

    `tailscale.mode: "funnel"` вимагає `gateway.auth.mode: "password"`; і Serve, і Funnel вимагають `gateway.bind: "loopback"`.

  </Tab>
</Tabs>

## Примітки щодо безпеки

- Автентифікація Gateway типово обов’язкова: токен, пароль, довірений проксі або, якщо ввімкнено, заголовки ідентичності Tailscale Serve.
- Прив’язки не до local loopback усе одно **вимагають** автентифікації Gateway: автентифікації за токеном/паролем або зворотного проксі з підтримкою ідентичності та `gateway.auth.mode: "trusted-proxy"`.
- Майстер початкового налаштування типово створює автентифікацію зі спільним секретом і зазвичай генерує токен Gateway, навіть на local loopback.
- У режимі зі спільним секретом інтерфейс надсилає `connect.params.auth.token` або `connect.params.auth.password` під час установлення з’єднання WebSocket.
- З `gateway.tls.enabled: true` локальні допоміжні засоби панелі керування та стану відображають URL-адреси `https://` і URL-адреси WebSocket `wss://`.
- У режимах з ідентичністю (Tailscale Serve, `trusted-proxy`) перевірка автентифікації WebSocket виконується за заголовками запиту замість спільного секрету.
- Для загальнодоступних розгортань інтерфейсу керування не на local loopback явно задайте `gateway.controlUi.allowedOrigins` (повні джерела). Приватні завантаження з того самого джерела приймаються без цього параметра для local loopback, RFC1918/локальних каналів, `.local`, `.ts.net` і хостів Tailscale CGNAT.
- `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback: true` вмикає резервне визначення джерела за заголовком Host; це небезпечне послаблення безпеки.
- Із Serve заголовки ідентичності Tailscale задовольняють вимоги автентифікації інтерфейсу керування/WebSocket, коли `gateway.auth.allowTailscale: true` (токен або пароль не потрібні). Кінцеві точки HTTP API не використовують заголовки ідентичності Tailscale; вони завжди дотримуються звичайного режиму HTTP-автентифікації Gateway. Задайте `gateway.auth.allowTailscale: false`, щоб вимагати явні облікові дані навіть через Serve. Цей безтокеновий процес передбачає, що самому хосту Gateway довіряють. Див. [Tailscale](/uk/gateway/tailscale) і [Безпека](/uk/gateway/security).

## Збирання інтерфейсу

Gateway обслуговує статичні файли з `dist/control-ui`:

```bash
pnpm ui:build
```
