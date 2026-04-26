---
read_when:
    - Configurando ou depurando controle remoto no macOS
summary: Fluxo do app de macOS para controlar um gateway OpenClaw remoto por SSH
title: Controle remoto
x-i18n:
    generated_at: "2026-04-26T11:33:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4de4980fe378fc9b685cf7732d21a80c640088191308b8ef1d3df9f468cb5be2
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Esse fluxo permite que o app de macOS atue como um controle remoto completo para um gateway OpenClaw em execução em outro host (desktop/servidor). Esse é o recurso **Remoto por SSH** (execução remota) do app. Todos os recursos — verificações de integridade, encaminhamento do Voice Wake e Web Chat — reutilizam a mesma configuração SSH remota em _Settings → General_.

## Modos

- **Local (este Mac)**: tudo é executado no laptop. Não há SSH envolvido.
- **Remoto por SSH (padrão)**: comandos do OpenClaw são executados no host remoto. O app do mac abre uma conexão SSH com `-o BatchMode`, além da identidade/chave escolhida e um encaminhamento de porta local.
- **Remoto direto (ws/wss)**: sem túnel SSH. O app do mac se conecta diretamente à URL do gateway (por exemplo, via Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): usa `ssh -N -L ...` para encaminhar a porta do gateway para localhost. O gateway verá o IP do node como `127.0.0.1` porque o túnel é loopback.
- **Direto (ws/wss)**: conecta diretamente à URL do gateway. O gateway vê o IP real do cliente.

No modo de túnel SSH, hostnames LAN/tailnet descobertos são salvos como
`gateway.remote.sshTarget`. O app mantém `gateway.remote.url` no endpoint local
do túnel, por exemplo `ws://127.0.0.1:18789`, para que CLI, Web Chat e
o serviço local de hospedagem de node usem o mesmo transporte loopback seguro.

A automação de navegador no modo remoto é controlada pelo node host da CLI, não pelo
node nativo do app de macOS. O app inicia o serviço de node host instalado quando
possível; se você precisar de controle de navegador a partir desse Mac, instale/inicie-o com
`openclaw node install ...` e `openclaw node start` (ou execute
`openclaw node run ...` em foreground), e então mire nesse node com suporte a navegador.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (symlink em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Abra SSH com auth por chave. Recomendamos IPs do **Tailscale** para acessibilidade estável fora da LAN.

## Configuração do app de macOS

1. Abra _Settings → General_.
2. Em **OpenClaw runs**, escolha **Remote over SSH** e defina:
   - **Transport**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcional `:port`).
     - Se o gateway estiver na mesma LAN e publicar Bonjour, escolha-o na lista descoberta para preencher esse campo automaticamente.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado para comandos.
   - **CLI path** (avançado): caminho opcional para um entrypoint/binário `openclaw` executável (preenchido automaticamente quando publicado).
3. Clique em **Test remote**. Sucesso indica que `openclaw status --json` no remoto é executado corretamente. Falhas normalmente significam problemas de PATH/CLI; saída 127 significa que a CLI não foi encontrada no remoto.
4. Verificações de integridade e Web Chat agora serão executados por esse túnel SSH automaticamente.

## Web Chat

- **Túnel SSH**: o Web Chat se conecta ao gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: o Web Chat se conecta diretamente à URL configurada do gateway.
- Não existe mais um servidor HTTP separado de WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Notificações). Execute o onboarding nessa máquina para concedê-las uma vez.
- Nodes publicam seu estado de permissões via `node.list` / `node.describe`, para que agentes saibam o que está disponível.

## Observações de segurança

- Prefira binds em loopback no host remoto e conecte-se via SSH ou Tailscale.
- O tunelamento SSH usa verificação estrita de chave do host; confie primeiro na chave do host para que ela exista em `~/.ssh/known_hosts`.
- Se você fizer bind do Gateway em uma interface não loopback, exija auth válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- Veja [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute novamente o login nesse host se a auth expirar. A verificação de integridade mostrará problemas de vínculo.

## Solução de problemas

- **exit 127 / not found**: `openclaw` não está no PATH para shells sem login. Adicione-o a `/etc/paths`, ao rc do seu shell ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: verifique acessibilidade SSH, PATH e se o Baileys está logado (`openclaw status --json`).
- **Web Chat travado**: confirme se o gateway está em execução no host remoto e se a porta encaminhada corresponde à porta WS do gateway; a UI exige uma conexão WS íntegra.
- **Node IP mostra 127.0.0.1**: esperado com o túnel SSH. Troque **Transport** para **Direct (ws/wss)** se quiser que o gateway veja o IP real do cliente.
- **Voice Wake**: frases de ativação são encaminhadas automaticamente no modo remoto; não é necessário um encaminhador separado.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway remoto pronto" --sound Glass
```

Não existe mais uma opção global de “som padrão” no app; chamadores escolhem um som (ou nenhum) por solicitação.

## Relacionados

- [App de macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
