---
read_when:
    - Configurando ou depurando o controle remoto do Mac
summary: Fluxo do app macOS para controlar um Gateway OpenClaw remoto
title: Controle remoto
x-i18n:
    generated_at: "2026-06-28T00:12:25Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 96ac4af5af9d3250f907818751120984106c3c7bcb1f3349d3f0678b4fefb120
    source_path: platforms/mac/remote.md
    workflow: 16
---

Esse fluxo permite que o app para macOS atue como um controle remoto completo para um Gateway OpenClaw em execução em outro host (desktop/servidor). O app pode se conectar diretamente a URLs de Gateway confiáveis na LAN/Tailnet ou gerenciar um túnel SSH quando o Gateway remoto aceita apenas loopback. As verificações de integridade, o encaminhamento do Voice Wake e o Web Chat reutilizam a mesma configuração remota de _Settings → General_.

## Modos

- **Local (este Mac)**: Tudo é executado no laptop. Sem SSH envolvido.
- **Remoto por SSH (padrão)**: Os comandos do OpenClaw são executados no host remoto. O app para Mac abre uma conexão SSH com `-o BatchMode`, além da identidade/chave escolhida por você e um encaminhamento de porta local.
- **Remoto direto (ws/wss)**: Sem túnel SSH. O app para Mac se conecta diretamente à URL do Gateway (por exemplo, via LAN, Tailscale, Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): Usa `ssh -N -L ...` para encaminhar a porta do Gateway para localhost. O Gateway verá o IP do nó como `127.0.0.1` porque o túnel é loopback.
- **Direto (ws/wss)**: Conecta diretamente à URL do Gateway. O Gateway vê o IP real do cliente.

No modo de túnel SSH, nomes de host de LAN/tailnet descobertos são salvos como
`gateway.remote.sshTarget`. O app mantém `gateway.remote.url` no endpoint local
do túnel, por exemplo `ws://127.0.0.1:18789`, para que a CLI, o Web Chat e
o serviço local node-host usem todos o mesmo transporte loopback seguro.
Quando a descoberta retorna tanto IPs brutos da Tailnet quanto nomes de host estáveis, o app
prefere nomes Tailscale MagicDNS ou LAN para que conexões remotas sobrevivam melhor
a mudanças de endereço.
Se a porta local do túnel for diferente da porta remota do Gateway, defina
`gateway.remote.remotePort` como a porta no host remoto.

A automação de navegador no modo remoto pertence ao host de nó da CLI, não ao
nó nativo do app para macOS. O app inicia o serviço de host de nó instalado quando
possível; se você precisar de controle de navegador a partir desse Mac, instale/inicie-o com
`openclaw node install ...` e `openclaw node start` (ou execute
`openclaw node run ...` em primeiro plano) e então direcione para esse
nó com suporte a navegador.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (crie um symlink em `/usr/local/bin` ou `/opt/homebrew/bin` se necessário).
3. Somente para transporte SSH: abra o SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcance estável fora da LAN.

## Configuração do app para macOS

Para pré-configurar o app sem o fluxo de boas-vindas:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Para um Gateway já acessível em uma LAN confiável ou Tailnet, ignore completamente o SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Isso grava a configuração remota, marca o onboarding como concluído e permite que o app controle
o transporte selecionado quando ele iniciar.

1. Abra _Settings → General_.
2. Em **OpenClaw runs**, escolha **Remote** e defina:
   - **Transport**: **Túnel SSH** ou **Direto (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional).
     - Se o Gateway estiver na mesma LAN e anunciar Bonjour, escolha-o na lista descoberta para preencher automaticamente este campo.
   - **Gateway URL** (somente Direto): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado para comandos.
   - **CLI path** (avançado): caminho opcional para um entrypoint/binário `openclaw` executável (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. Sucesso indica que o `openclaw status --json` remoto é executado corretamente. Falhas geralmente significam problemas de PATH/CLI; o código de saída 127 significa que a CLI não foi encontrada remotamente.
4. As verificações de integridade e o Web Chat agora serão executados automaticamente pelo transporte selecionado.

## Web Chat

- **Túnel SSH**: O Web Chat se conecta ao Gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: O Web Chat se conecta diretamente à URL configurada do Gateway.
- Não há mais um servidor HTTP separado para WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações de TCC que o local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Execute o onboarding nessa máquina para concedê-las uma vez.
- Os nós anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Notas de segurança

- Prefira binds de loopback no host remoto e conecte via SSH, Tailscale Serve ou uma URL direta confiável de Tailnet/LAN.
- O tunelamento SSH usa verificação estrita de chave de host; confie primeiro na chave do host para que ela exista em `~/.ssh/known_hosts`.
- Se você fizer bind do Gateway a uma interface que não seja loopback, exija autenticação válida do Gateway: token, senha ou um proxy reverso com identidade ciente usando `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade exibirá problemas de vínculo.

## Solução de problemas

- **exit 127 / não encontrado**: `openclaw` não está no PATH para shells sem login. Adicione-o a `/etc/paths`, ao rc do seu shell ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda de integridade falhou**: verifique o alcance via SSH, o PATH e se o Baileys está autenticado (`openclaw status --json`).
- **Web Chat travado**: confirme que o Gateway está em execução no host remoto e que a porta encaminhada corresponde à porta WS do Gateway; a interface exige uma conexão WS íntegra.
- **IP do nó mostra 127.0.0.1**: esperado com o túnel SSH. Mude **Transport** para **Direto (ws/wss)** se quiser que o Gateway veja o IP real do cliente.
- **Dashboard funciona, mas as capacidades do Mac estão offline**: isso significa que a conexão de operador/controle do app está íntegra, mas a conexão do nó complementar não está conectada ou está sem sua superfície de comandos. Abra a seção de dispositivo da barra de menus e verifique se o Mac está `paired · disconnected`. Para endpoints Tailscale Serve `wss://*.ts.net`, o app detecta pins TLS leaf legados obsoletos após a rotação de certificado, limpa o pin obsoleto quando o macOS confia no novo certificado e tenta novamente automaticamente. Se o certificado não for confiável pelo sistema ou o host não for um nome Tailscale Serve, defina `gateway.remote.tlsFingerprint` como a impressão digital esperada do certificado, revise o certificado ou mude para **Remoto por SSH**.
- **Voice Wake**: as frases de acionamento são encaminhadas automaticamente no modo remoto; nenhum encaminhador separado é necessário.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não há mais uma alternância global de "som padrão" no app; os chamadores escolhem um som (ou nenhum) por solicitação.

## Relacionados

- [app para macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
