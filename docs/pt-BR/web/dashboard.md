---
read_when:
    - Alterando os modos de autenticação ou exposição do painel
summary: Acesso e autenticação do painel do Gateway (Control UI)
title: Painel
x-i18n:
    generated_at: "2026-04-24T06:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8753e0edf0a04e4c36b76aa6973dcd9d903a98c0b85e498bfcb05e728bb6272b
    source_path: web/dashboard.md
    workflow: 15
---

O painel do Gateway é a Control UI no browser servida em `/` por padrão
(substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Referências principais:

- [Control UI](/pt-BR/web/control-ui) para uso e capacidades da UI.
- [Tailscale](/pt-BR/gateway/tailscale) para automação Serve/Funnel.
- [Superfícies web](/pt-BR/web) para modos de bind e observações de segurança.

A autenticação é aplicada no handshake do WebSocket por meio do caminho de autenticação configurado do gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Consulte `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

Observação de segurança: a Control UI é uma **superfície administrativa** (chat, config, aprovações de exec).
Não a exponha publicamente. A UI mantém tokens de URL do painel em sessionStorage
para a sessão atual da aba do browser e a URL do gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, a CLI abre automaticamente o painel e imprime um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre o browser se possível, mostra dica de SSH se estiver headless).
- Se a UI solicitar autenticação por segredo compartilhado, cole o token ou a
  senha configurados nas configurações da Control UI.

## Noções básicas de autenticação (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **Fonte de token de segredo compartilhado**: `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` pode passá-lo via fragmento de URL
  para bootstrap de uso único, e a Control UI o mantém em sessionStorage para a
  sessão atual da aba do browser e a URL do gateway selecionada, em vez de localStorage.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard`
  imprime/copia/abre por design uma URL sem token. Isso evita expor
  tokens gerenciados externamente em logs do shell, histórico da área de transferência ou argumentos
  de inicialização do browser.
- Se `gateway.auth.token` estiver configurado como SecretRef e não for resolvido no seu
  shell atual, `openclaw dashboard` ainda imprime uma URL sem token mais
  orientações acionáveis de configuração de autenticação.
- **Senha de segredo compartilhado**: use a `gateway.auth.password` configurada (ou
  `OPENCLAW_GATEWAY_PASSWORD`). O painel não persiste senhas entre recarregamentos.
- **Modos com identidade**: o Tailscale Serve pode satisfazer a autenticação da Control UI/WebSocket
  via cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`, e um
  proxy reverso com reconhecimento de identidade fora de loopback pode satisfazer
  `gateway.auth.mode: "trusted-proxy"`. Nesses modos, o painel não
  precisa de um segredo compartilhado colado para o WebSocket.
- **Não localhost**: use Tailscale Serve, um bind fora de loopback com segredo compartilhado, um
  proxy reverso com reconhecimento de identidade fora de loopback com
  `gateway.auth.mode: "trusted-proxy"`, ou um túnel SSH. APIs HTTP ainda usam
  autenticação por segredo compartilhado, a menos que você execute intencionalmente
  `gateway.auth.mode: "none"` com ingress privado ou autenticação HTTP por trusted-proxy. Consulte
  [Superfícies web](/pt-BR/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Garanta que o gateway esteja acessível (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` e depois abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, clientes podem fazer uma nova tentativa confiável com um token de dispositivo em cache quando o gateway retorna hints de retry. Essa nova tentativa com token em cache reutiliza os escopos aprovados em cache do token; chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado. Se a autenticação ainda falhar após essa nova tentativa, resolva manualmente a divergência de token.
- Fora desse caminho de retry, a precedência de autenticação na conexão é token/senha compartilhado explícito primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e depois token de bootstrap.
- No caminho assíncrono da Control UI com Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes que o limitador de autenticação com falha as registre, então a segunda nova tentativa ruim concorrente já pode mostrar `retry later`.
- Para etapas de reparo de divergência de token, siga [Checklist de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado a partir do host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva a `gateway.auth.password` configurada ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provider de segredo externo ou exporte
    `OPENCLAW_GATEWAY_TOKEN` neste shell, depois execute `openclaw dashboard` novamente
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do painel, cole o token ou a senha no campo de autenticação
  e depois conecte.
- O seletor de idioma da UI fica em **Overview -> Gateway Access -> Language**.
  Ele faz parte do cartão de acesso, não da seção Appearance.

## Relacionado

- [Control UI](/pt-BR/web/control-ui)
- [WebChat](/pt-BR/web/webchat)
