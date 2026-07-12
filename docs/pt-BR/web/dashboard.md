---
read_when:
    - Alteração dos modos de autenticação ou exposição do painel de controle
summary: Acesso e autenticação do painel do Gateway (interface de controle)
title: Painel de controle
x-i18n:
    generated_at: "2026-07-12T15:47:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 34d7ab6c5f503f2dd3ab212a1fc6b47c84fcd47c5ad88aa9cdbbbbc73b7ef90e
    source_path: web/dashboard.md
    workflow: 16
---

O painel do Gateway é a interface de controle no navegador servida em `/` por padrão (substitua com `gateway.controlUi.basePath`).

Abertura rápida (Gateway local):

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/) (ou [http://localhost:18789/](http://localhost:18789/))
- Com `gateway.tls.enabled: true`, use `https://127.0.0.1:18789/` e `wss://127.0.0.1:18789` para o endpoint WebSocket.

Referências principais:

- [Interface de controle](/pt-BR/web/control-ui) para uso e recursos da interface.
- [Tailscale](/pt-BR/gateway/tailscale) para automação de Serve/Funnel.
- [Superfícies web](/pt-BR/web) para modos de vinculação e observações de segurança.

A autenticação é aplicada no handshake do WebSocket pelo caminho de autenticação configurado do Gateway:

- `connect.params.auth.token`
- `connect.params.auth.password`
- Cabeçalhos de identidade do Tailscale Serve quando `gateway.auth.allowTailscale: true`
- Cabeçalhos de identidade de proxy confiável quando `gateway.auth.mode: "trusted-proxy"`

Consulte `gateway.auth` em [Configuração do Gateway](/pt-BR/gateway/configuration).

<Warning>
A interface de controle é uma **superfície administrativa** (chat, configuração, aprovações de execução). Não a exponha publicamente. A interface mantém os tokens da URL do painel no sessionStorage para a aba atual do navegador e a URL do gateway selecionada, e os remove da URL após o carregamento. Prefira localhost, Tailscale Serve ou um túnel SSH.
</Warning>

## Caminho rápido (recomendado)

- Após a integração inicial, a CLI abre automaticamente o painel e exibe um link limpo (sem token).
- Reabra a qualquer momento: `openclaw dashboard` (copia o link, abre um navegador se possível e exibe uma dica de SSH se estiver sem interface gráfica).
- Se o envio para a área de transferência e para o navegador falhar, `openclaw dashboard` ainda exibirá a URL limpa e informará que você deve anexar seu token (de `OPENCLAW_GATEWAY_TOKEN` ou `gateway.auth.token`) como a chave `token` do fragmento da URL; ele nunca exibe o valor do token nos logs.
- Se a interface solicitar autenticação por segredo compartilhado, cole o token ou a senha configurada nas configurações da interface de controle.

## Noções básicas de autenticação (local versus remoto)

- **Localhost**: abra `http://127.0.0.1:18789/`.
- **TLS do Gateway**: quando `gateway.tls.enabled: true`, os links do painel/status usam `https://` e os links WebSocket da interface de controle usam `wss://`.
- **Origem do token de segredo compartilhado**: `gateway.auth.token` (ou `OPENCLAW_GATEWAY_TOKEN`). `openclaw dashboard` pode transmiti-lo pelo fragmento da URL para uma inicialização única; a interface de controle o mantém no sessionStorage para a aba atual e a URL do gateway selecionada, não no localStorage.
- Se `gateway.auth.token` for gerenciado por SecretRef, `openclaw dashboard` exibe/copia/abre uma URL sem token por design, para evitar expor tokens gerenciados externamente em logs do shell, no histórico da área de transferência ou em argumentos de inicialização do navegador. Se a referência não puder ser resolvida no shell atual, ele ainda exibirá a URL sem token com orientações práticas para configurar a autenticação.
- **Senha de segredo compartilhado**: use a `gateway.auth.password` configurada (ou `OPENCLAW_GATEWAY_PASSWORD`). O painel não mantém senhas após recarregamentos.
- **Modos baseados em identidade**: o Tailscale Serve atende à autenticação da interface de controle/WebSocket por meio de cabeçalhos de identidade quando `gateway.auth.allowTailscale: true`; um proxy reverso com reconhecimento de identidade fora do loopback atende a `gateway.auth.mode: "trusted-proxy"`. Nenhum deles exige que um segredo compartilhado seja colado para o WebSocket.
- **Fora do localhost**: use o Tailscale Serve, uma vinculação de segredo compartilhado fora do loopback, um proxy reverso com reconhecimento de identidade fora do loopback com `gateway.auth.mode: "trusted-proxy"` ou um túnel SSH. As APIs HTTP ainda usam autenticação por segredo compartilhado, a menos que você execute intencionalmente `gateway.auth.mode: "none"` com ingresso privado ou autenticação HTTP por proxy confiável. Consulte [Superfícies web](/pt-BR/web).

## Abrir no Telegram

Bots do Telegram podem abrir o painel como um Mini App do Telegram com `/dashboard`.

Requisitos:

- `gateway.tailscale.mode: "serve"` ou `"funnel"` para que o Telegram receba uma URL HTTPS do Mini App.
- O remetente do Telegram deve ser o proprietário do bot: um ID numérico de usuário do Telegram em `commands.ownerAllowFrom` ou no `channels.telegram.allowFrom` efetivo da conta selecionada.
- Execute `/dashboard` em uma mensagem direta com o bot. Invocações em grupos apenas informam que você deve abrir o comando em uma mensagem direta e não incluem um botão.
- Instalações com Docker: os modos Serve/Funnel exigem que o gateway se vincule ao loopback junto ao `tailscaled`, o que a rede em ponte com portas publicadas não consegue atender. Execute o contêiner do gateway com `network_mode: host` e monte o socket `tailscaled` do host (`/var/run/tailscale`), além da CLI `tailscale`, no contêiner.

O Mini App realiza uma transferência única de proprietário e redireciona para a interface de controle com um token de inicialização de curta duração. Ele não expõe um token compartilhado do gateway na URL.

Fora do escopo da v1:

- O iframe do Telegram Web não é compatível.
- Tailscale Serve/Funnel é o único caminho de URL publicada compatível.

<a id="if-you-see-unauthorized-1008"></a>

## Se você vir "unauthorized" / 1008

- Confirme se o gateway está acessível: localmente, `openclaw status`; remotamente, crie o túnel SSH `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` e abra `http://127.0.0.1:18789/`.
- Para `AUTH_TOKEN_MISMATCH`, os clientes podem fazer uma nova tentativa confiável com um token de dispositivo armazenado em cache quando o gateway retorna dicas de nova tentativa; essa tentativa reutiliza os escopos aprovados armazenados em cache do token (chamadores com `deviceToken`/`scopes` explícitos mantêm o conjunto de escopos solicitado). Se a autenticação continuar falhando após essa tentativa, resolva manualmente a divergência do token.
- Para `AUTH_SCOPE_MISMATCH`, o token do dispositivo foi reconhecido, mas não contém os escopos solicitados; refaça o pareamento ou aprove o novo conjunto de escopos em vez de trocar o token compartilhado do gateway.
- Fora desse caminho de nova tentativa, a precedência da autenticação da conexão é: token/senha compartilhado explícito, depois `deviceToken` explícito, depois token de dispositivo armazenado e, por fim, token de inicialização.
- No caminho assíncrono do Tailscale Serve, tentativas malsucedidas para o mesmo `{scope, ip}` são serializadas antes que o limitador de falhas de autenticação as registre; portanto, uma segunda tentativa simultânea incorreta já pode exibir `retry later`.
- Para as etapas de correção da divergência de token, consulte a [Lista de verificação para recuperação de divergência de token](/pt-BR/cli/devices#token-drift-recovery-checklist).
- Recupere ou forneça o segredo compartilhado no host do gateway:
  - Token: `openclaw config get gateway.auth.token`
  - Senha: resolva o `gateway.auth.password` configurado ou `OPENCLAW_GATEWAY_PASSWORD`
  - Token gerenciado por SecretRef: resolva o provedor externo de segredos ou exporte `OPENCLAW_GATEWAY_TOKEN` neste shell e execute `openclaw dashboard` novamente
  - Nenhum segredo compartilhado configurado: `openclaw doctor --generate-gateway-token`
- Nas configurações do painel, cole o token ou a senha no campo de autenticação e conecte-se.
- O seletor de idioma da interface fica em **Settings -> General -> Language**, não em Appearance.

## Relacionados

- [Interface de controle](/pt-BR/web/control-ui)
- [WebChat](/pt-BR/web/webchat)
