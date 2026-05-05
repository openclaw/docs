---
read_when:
    - Alteração da autenticação ou dos modos de exposição do painel
summary: Acesso e autenticação do painel do Gateway (interface de controle)
title: Painel
x-i18n:
    generated_at: "2026-05-05T01:50:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0e2086587fee6303221663748c3047886a5beae29862d66e2edf78e02bfe3da1
    source_path: web/dashboard.md
    workflow: 16
---

O painel do Gateway é a Interface de Controle no navegador servida em `/` por padrão
(substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Com `gateway.tls.enabled: true`, use `https://127.0.0.1:18789/` e
  `wss://127.0.0.1:18789` para o endpoint WebSocket.

Referências principais:

- [Interface de Controle](/pt-BR/web/control-ui) para uso e recursos da UI.
- [Tailscale](/pt-BR/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies Web](/pt-BR/web) para modos de bind e notas de segurança.

A autenticação é aplicada no handshake WebSocket pelo caminho de autenticação do gateway
configurado:

- `connect.params.auth.token`
- `connect.params.auth.password`
- cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

Veja `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

Nota de segurança: a Interface de Controle é uma **superfície de administração** (chat, configuração, aprovações de execução).
Não a exponha publicamente. A UI mantém tokens de URL do painel em sessionStorage
para a sessão atual da aba do navegador e a URL do gateway selecionada, e os remove da URL após o carregamento.
Prefira localhost, Tailscale Serve ou um túnel SSH.

## Caminho rápido (recomendado)

- Após a integração inicial, a CLI abre automaticamente o painel e imprime um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre o navegador se possível, mostra dica de SSH se estiver sem interface gráfica).
- Se a entrega por área de transferência e navegador falhar, `openclaw dashboard` ainda imprime a
  URL limpa e informa para usar o token de `OPENCLAW_GATEWAY_TOKEN` ou
  `gateway.auth.token` como a chave de fragmento de URL `token`; ele não imprime valores de token
  nos logs.
- Se a UI solicitar autenticação por segredo compartilhado, cole o token ou
  a senha configurados nas configurações da Interface de Controle.

## Noções básicas de autenticação (local vs remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **TLS do Gateway**: quando `gateway.tls.enabled: true`, links de painel/status usam
  `https://` e links WebSocket da Interface de Controle usam `wss://`.
- **Origem do token de segredo compartilhado**: `gateway.auth.token` (ou
  `OPENCLAW_GATEWAY_TOKEN`); `openclaw dashboard` pode passá-lo via fragmento de URL
  para bootstrap único, e a Interface de Controle o mantém em sessionStorage para a
  sessão atual da aba do navegador e a URL do gateway selecionada em vez de localStorage.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard`
  imprime/copia/abre uma URL sem token por design. Isso evita expor
  tokens gerenciados externamente em logs do shell, histórico da área de transferência ou argumentos de
  inicialização do navegador.
- Se `gateway.auth.token` estiver configurado como SecretRef e não for resolvido no seu
  shell atual, `openclaw dashboard` ainda imprime uma URL sem token mais
  orientações acionáveis de configuração de autenticação.
- **Senha de segredo compartilhado**: use o `gateway.auth.password` configurado (ou
  `OPENCLAW_GATEWAY_PASSWORD`). O painel não persiste senhas entre
  recarregamentos.
- **Modos com identidade**: Tailscale Serve pode satisfazer a autenticação da Interface de Controle/WebSocket
  via cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`, e um
  proxy reverso com reconhecimento de identidade que não seja loopback pode satisfazer
  `gateway.auth.mode: "trusted-proxy"`. Nesses modos, o painel não
  precisa de um segredo compartilhado colado para o WebSocket.
- **Não localhost**: use Tailscale Serve, um bind de segredo compartilhado que não seja loopback, um
  proxy reverso com reconhecimento de identidade que não seja loopback com
  `gateway.auth.mode: "trusted-proxy"` ou um túnel SSH. APIs HTTP ainda usam
  autenticação por segredo compartilhado, a menos que você execute intencionalmente
  `gateway.auth.mode: "none"` com private-ingress ou autenticação HTTP por proxy confiável. Veja
  [Superfícies Web](/pt-BR/web).

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Garanta que o gateway esteja acessível (local: `openclaw status`; remoto: túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@host` e então abra `http://127.0.0.1:18789/`).
- Para `AUTH_TOKEN_MISMATCH`, clientes podem fazer uma nova tentativa confiável com um token de dispositivo em cache quando o gateway retorna dicas de nova tentativa. Essa nova tentativa com token em cache reutiliza os escopos aprovados em cache do token; chamadores com `deviceToken` explícito / `scopes` explícitos mantêm o conjunto de escopos solicitado. Se a autenticação ainda falhar após essa nova tentativa, resolva a divergência de token manualmente.
- Fora desse caminho de nova tentativa, a precedência de autenticação de conexão é primeiro token/senha compartilhados explícitos, depois `deviceToken` explícito, depois token de dispositivo armazenado, depois token de bootstrap.
- No caminho assíncrono da Interface de Controle via Tailscale Serve, tentativas com falha para o mesmo
  `{scope, ip}` são serializadas antes que o limitador de autenticação com falha as registre, então
  a segunda nova tentativa incorreta simultânea já pode mostrar `retry later`.
- Para etapas de reparo de divergência de token, siga a [lista de verificação de recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado a partir do host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva o `gateway.auth.password` configurado ou
    `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provedor de segredo externo ou exporte
    `OPENCLAW_GATEWAY_TOKEN` neste shell, então execute novamente `openclaw dashboard`
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do painel, cole o token ou a senha no campo de autenticação,
  então conecte.
- O seletor de idioma da UI fica em **Visão geral -> Acesso ao Gateway -> Idioma**.
  Ele faz parte do cartão de acesso, não da seção Aparência.

## Relacionados

- [Interface de Controle](/pt-BR/web/control-ui)
- [WebChat](/pt-BR/web/webchat)
