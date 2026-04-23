---
read_when:
    - Alterar modos de autenticação ou exposição do dashboard
summary: Acesso e autenticação do painel do Gateway (UI de controle)
title: Dashboard
x-i18n:
    generated_at: "2026-04-23T14:09:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5b50d711711f70c51d65f3908b7a8c1e0e978ed46a853f0ab48c13dfe0348ff
    source_path: web/dashboard.md
    workflow: 15
---

# Dashboard (UI de controle)

O painel do Gateway é a UI de controle no navegador servida em `/` por padrão
(substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))

Referências principais:

- [UI de controle](/pt-BR/web/control-ui) para uso e capacidades da UI.
- [Tailscale](/pt-BR/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies web](/pt-BR/web) para modos de bind e observações de segurança.

A autenticação é imposta no handshake do WebSocket pelo caminho de autenticação
do gateway configurado:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de trusted-proxy quando `gateway.auth.mode: "trusted-proxy"`

Veja `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

Observação de segurança: a UI de controle é uma **superfície de administração** (chat, configuração, aprovações de exec).
Não a exponha publicamente. A UI mantém tokens de URL do dashboard em sessionStorage
para a sessão atual da aba do navegador e URL do gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após o onboarding, a CLI abre automaticamente o dashboard e imprime um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre o navegador se possível, mostra dica de SSH se estiver sem interface).
- Se a UI solicitar autenticação por segredo compartilhado, cole o token ou
  senha configurados nas configurações da UI de controle.

## Noções básicas de autenticação (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **Fonte de token por segredo compartilhado**: `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` pode passá-lo por fragmento de URL
  para bootstrap único, e a UI de controle o mantém em sessionStorage para a
  sessão atual da aba do navegador e URL do gateway selecionada, em vez de localStorage.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard`
  imprime/copia/abre uma URL sem token por design. Isso evita expor
  tokens gerenciados externamente em logs de shell, histórico da área de transferência ou
  argumentos de inicialização do navegador.
- Se `gateway.auth.token` estiver configurado como SecretRef e não puder ser resolvido no
  shell atual, `openclaw dashboard` ainda imprime uma URL sem token, além de
  orientações acionáveis de configuração de autenticação.
- **Senha por segredo compartilhado**: use a `gateway.auth.password` configurada (ou
  `OPENCLAW_GATEWAY_PASSWORD`). O dashboard não persiste senhas entre recarregamentos.
- **Modos com identidade**: o Tailscale Serve pode satisfazer a autenticação da UI de controle/WebSocket
  via cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`, e um
  proxy reverso com reconhecimento de identidade fora de loopback pode satisfazer
  `gateway.auth.mode: "trusted-proxy"`. Nesses modos, o dashboard não
  precisa de um segredo compartilhado colado para o WebSocket.
- **Não localhost**: use Tailscale Serve, um bind fora de loopback com segredo compartilhado, um
  proxy reverso fora de loopback com reconhecimento de identidade e
  `gateway.auth.mode: "trusted-proxy"`, ou um túnel SSH. APIs HTTP ainda usam
  autenticação por segredo compartilhado, a menos que você execute intencionalmente um ingresso privado com
  `gateway.auth.mode: "none"` ou autenticação HTTP por trusted-proxy. Veja
  [Superfícies web](/pt-BR/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Verifique se o gateway está acessível (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, os clientes podem fazer uma nova tentativa confiável com um token de dispositivo em cache quando o gateway retorna dicas de retry. Essa nova tentativa com token em cache reutiliza os escopos aprovados em cache do token; chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado. Se a autenticação ainda falhar após essa nova tentativa, resolva manualmente o desvio do token.
- Fora desse caminho de retry, a precedência de autenticação na conexão é token/senha compartilhados explícitos primeiro, depois `deviceToken` explícito, depois token de dispositivo armazenado e então token de bootstrap.
- No caminho assíncrono da UI de controle via Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes que o limitador de falhas de autenticação as registre, então
  a segunda nova tentativa inválida concorrente já pode mostrar `retry later`.
- Para etapas de reparo de desvio de token, siga [Checklist de recuperação de desvio de token](/pt-BR/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado a partir do host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva a `gateway.auth.password` configurada ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provider de segredo externo ou exporte
    `OPENCLAW_GATEWAY_TOKEN` neste shell e então execute novamente `openclaw dashboard`
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do dashboard, cole o token ou a senha no campo de autenticação
  e então conecte.
- O seletor de idioma da UI fica em **Overview -> Gateway Access -> Language**.
  Ele faz parte do cartão de acesso, não da seção Appearance.
