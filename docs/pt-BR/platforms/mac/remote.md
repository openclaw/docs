---
read_when:
    - Configurando ou depurando o controle remoto no macOS
summary: Fluxo do aplicativo macOS para controlar um gateway OpenClaw remoto por SSH
title: Controle remoto
x-i18n:
    generated_at: "2026-04-24T06:01:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1b436fe35db300f719cf3e72530e74914df6023509907d485670746c29656d8
    source_path: platforms/mac/remote.md
    workflow: 15
---

# OpenClaw remoto (macOS ⇄ host remoto)

Esse fluxo permite que o aplicativo macOS atue como um controle remoto completo para um gateway OpenClaw em execução em outro host (desktop/servidor). É o recurso **Remote over SSH** (execução remota) do app. Todos os recursos — verificações de integridade, encaminhamento de Voice Wake e Web Chat — reutilizam a mesma configuração remota de SSH em _Settings → General_.

## Modos

- **Local (este Mac)**: tudo é executado no laptop. Não há SSH envolvido.
- **Remote over SSH (padrão)**: comandos do OpenClaw são executados no host remoto. O app mac abre uma conexão SSH com `-o BatchMode`, além da identidade/chave escolhida e um encaminhamento de porta local.
- **Remote direct (ws/wss)**: sem túnel SSH. O app mac se conecta diretamente à URL do gateway (por exemplo, via Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): usa `ssh -N -L ...` para encaminhar a porta do gateway para localhost. O gateway verá o IP do node como `127.0.0.1` porque o túnel está em loopback.
- **Direto (ws/wss)**: conecta diretamente à URL do gateway. O gateway vê o IP real do cliente.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (crie um symlink em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Abra o SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcance estável fora da LAN.

## Configuração do app macOS

1. Abra _Settings → General_.
2. Em **OpenClaw runs**, escolha **Remote over SSH** e defina:
   - **Transport**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (opcional `:port`).
     - Se o gateway estiver na mesma LAN e anunciar Bonjour, escolha-o na lista descoberta para preencher automaticamente esse campo.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho do checkout remoto usado para comandos.
   - **CLI path** (avançado): caminho opcional para um entrypoint/binário executável do `openclaw` (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. O sucesso indica que `openclaw status --json` remoto é executado corretamente. Falhas geralmente significam problemas de PATH/CLI; saída 127 significa que a CLI não foi encontrada remotamente.
4. Verificações de integridade e Web Chat agora serão executadas automaticamente por esse túnel SSH.

## Web Chat

- **Túnel SSH**: o Web Chat se conecta ao gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direct (ws/wss)**: o Web Chat se conecta diretamente à URL configurada do gateway.
- Não há mais um servidor HTTP separado do WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações de TCC que o local (Automation, Accessibility, Screen Recording, Microphone, Speech Recognition, Notifications). Execute o onboarding nessa máquina para concedê-las uma vez.
- Nodes anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Observações de segurança

- Prefira binds de loopback no host remoto e conecte-se via SSH ou Tailscale.
- O tunelamento SSH usa verificação estrita de chave do host; confie primeiro na chave do host para que ela exista em `~/.ssh/known_hosts`.
- Se você vincular o Gateway a uma interface fora de loopback, exija autenticação válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade com `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade revelará problemas de vínculo.

## Solução de problemas

- **exit 127 / not found**: `openclaw` não está no PATH para shells não interativos. Adicione-o a `/etc/paths`, ao rc do seu shell ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Health probe failed**: verifique alcance SSH, PATH e se o Baileys está autenticado (`openclaw status --json`).
- **Web Chat travado**: confirme que o gateway está em execução no host remoto e que a porta encaminhada corresponde à porta WS do gateway; a UI exige uma conexão WS íntegra.
- **Node IP mostra 127.0.0.1**: esperado com o túnel SSH. Troque **Transport** para **Direct (ws/wss)** se quiser que o gateway veja o IP real do cliente.
- **Voice Wake**: frases de ativação são encaminhadas automaticamente no modo remoto; nenhum encaminhador separado é necessário.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não existe mais um alternador global de “som padrão” no app; os chamadores escolhem um som (ou nenhum) por solicitação.

## Relacionado

- [Aplicativo macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
