---
read_when:
    - Alterando modos de autenticação ou exposição do painel
summary: Acesso e autenticação do painel do Gateway (Control UI)
title: Painel
x-i18n:
    generated_at: "2026-04-25T13:58:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e0e7c8cebe715f96e7f0e967e9fd86c4c6c54f7cc08a4291b02515fc0933a1a
    source_path: web/dashboard.md
    workflow: 15
---

O painel do Gateway é o Control UI no navegador servido em `/` por padrão
(substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Com `gateway.tls.enabled: true`, use `https://127.0.0.1:18789/` e
  `wss://127.0.0.1:18789` para o endpoint WebSocket.

Referências principais:

- [Control UI](/pt-BR/web/control-ui) para uso e recursos da UI.
- [Tailscale](/pt-BR/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies web](/pt-BR/web) para modos de bind e observações de segurança.

A autenticação é aplicada no handshake do WebSocket pelo caminho de autenticação
configurado do gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

Consulte `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

Observação de segurança: o Control UI é uma **superfície administrativa** (chat, configuração, aprovações de exec).
Não o exponha publicamente. A UI mantém tokens de URL do painel em `sessionStorage`
para a sessão atual da aba do navegador e a URL do gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, a CLI abre automaticamente o painel e imprime um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre o navegador se possível, mostra dica de SSH se estiver em modo headless).
- Se a UI solicitar autenticação por segredo compartilhado, cole o token ou
  a senha configurados nas configurações do Control UI.

## Noções básicas de autenticação (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **TLS do Gateway**: quando `gateway.tls.enabled: true`, links de painel/status usam
  `https://` e links WebSocket do Control UI usam `wss://`.
- **Origem do token de segredo compartilhado**: `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` pode passá-lo por fragmento de URL
  para bootstrap único, e o Control UI o mantém em `sessionStorage` para a
  sessão atual da aba do navegador e a URL do gateway selecionada, em vez de `localStorage`.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard`
  imprime/copia/abre uma URL sem token por design. Isso evita expor
  tokens gerenciados externamente em logs do shell, histórico da área de transferência ou argumentos
  de inicialização do navegador.
- Se `gateway.auth.token` estiver configurado como um SecretRef e não for resolvido no seu
  shell atual, `openclaw dashboard` ainda imprime uma URL sem token mais
  orientações práticas de configuração de autenticação.
- **Senha de segredo compartilhado**: use a `gateway.auth.password` configurada (ou
  `OPENCLAW_GATEWAY_PASSWORD`). O painel não persiste senhas entre
  recarregamentos.
- **Modos com identidade**: o Tailscale Serve pode satisfazer a autenticação do Control UI/WebSocket
  por cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`, e um
  proxy reverso com reconhecimento de identidade fora de loopback pode satisfazer
  `gateway.auth.mode: "trusted-proxy"`. Nesses modos, o painel não
  precisa de um segredo compartilhado colado para o WebSocket.
- **Não localhost**: use Tailscale Serve, um bind fora de loopback com segredo compartilhado, um
  proxy reverso fora de loopback com reconhecimento de identidade e
  `gateway.auth.mode: "trusted-proxy"`, ou um túnel SSH. As APIs HTTP ainda usam
  autenticação por segredo compartilhado, a menos que você execute intencionalmente um ingresso privado com
  `gateway.auth.mode: "none"` ou autenticação HTTP trusted-proxy. Consulte
  [Superfícies web](/pt-BR/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Verifique se o gateway está acessível (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, os clientes podem fazer uma nova tentativa confiável com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa. Essa nova tentativa com token em cache reutiliza os escopos aprovados em cache do token; chamadores com `deviceToken` explícito / `scopes` explícitos mantêm seu conjunto de escopos solicitado. Se a autenticação ainda falhar após essa nova tentativa, resolva manualmente a divergência de token.
- Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de bootstrap.
- No caminho assíncrono do Control UI via Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes de o limitador de autenticação com falha registrá-las, então
  a segunda nova tentativa ruim concorrente já pode mostrar `retry later`.
- Para etapas de reparo de divergência de token, siga a [Checklist de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado a partir do host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva a `gateway.auth.password` configurada ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provedor de segredo externo ou exporte
    `OPENCLAW_GATEWAY_TOKEN` neste shell e depois execute `openclaw dashboard` novamente
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do painel, cole o token ou a senha no campo de autenticação
  e depois conecte.
- O seletor de idioma da UI está em **Overview -> Gateway Access -> Language**.
  Ele faz parte do cartão de acesso, não da seção Appearance.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [WebChat](/pt-BR/web/webchat)
