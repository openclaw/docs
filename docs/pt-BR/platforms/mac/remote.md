---
read_when:
    - Configurando ou depurando o controle remoto do Mac
summary: Fluxo do app para macOS para controlar um Gateway OpenClaw remoto
title: Controle remoto
x-i18n:
    generated_at: "2026-06-27T17:43:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b3634785f797af55f7dc6d217e0116313e8ef7d314c503275fbc66b54eb29a69
    source_path: platforms/mac/remote.md
    workflow: 16
---

Esse fluxo permite que o app macOS funcione como um controle remoto completo para um Gateway OpenClaw em execução em outro host (desktop/servidor). O app pode se conectar diretamente a URLs de Gateway confiáveis de LAN/Tailnet ou gerenciar um túnel SSH quando o Gateway remoto está restrito a loopback. Verificações de integridade, encaminhamento do Voice Wake e Chat Web reutilizam a mesma configuração remota de _Configurações → Geral_.

## Modos

- **Local (este Mac)**: tudo roda no laptop. Sem SSH envolvido.
- **Remoto via SSH (padrão)**: os comandos do OpenClaw são executados no host remoto. O app para Mac abre uma conexão SSH com `-o BatchMode`, mais a identidade/chave escolhida e um encaminhamento de porta local.
- **Remoto direto (ws/wss)**: sem túnel SSH. O app para Mac se conecta diretamente à URL do Gateway (por exemplo, via LAN, Tailscale, Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): usa `ssh -N -L ...` para encaminhar a porta do Gateway para localhost. O Gateway verá o IP do nó como `127.0.0.1` porque o túnel usa loopback.
- **Direto (ws/wss)**: conecta diretamente à URL do Gateway. O Gateway vê o IP real do cliente.

No modo de túnel SSH, nomes de host de LAN/tailnet descobertos são salvos como
`gateway.remote.sshTarget`. O app mantém `gateway.remote.url` no endpoint do túnel
local, por exemplo `ws://127.0.0.1:18789`, para que a CLI, o Chat Web e
o serviço local de host de nó usem todos o mesmo transporte seguro por loopback.
Se a porta do túnel local for diferente da porta do Gateway remoto, defina
`gateway.remote.remotePort` como a porta no host remoto.

A automação de navegador no modo remoto pertence ao host de nó da CLI, não ao
nó nativo do app macOS. O app inicia o serviço de host de nó instalado quando
possível; se você precisar de controle de navegador a partir desse Mac, instale/inicie-o com
`openclaw node install ...` e `openclaw node start` (ou execute
`openclaw node run ...` em primeiro plano) e então direcione para esse
nó com suporte a navegador.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (crie um symlink em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Apenas para transporte SSH: habilite SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcance estável fora da LAN.

## Configuração do app macOS

Para pré-configurar o app sem o fluxo de boas-vindas:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Para um Gateway já acessível em uma LAN confiável ou Tailnet, ignore o SSH completamente:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Isso grava a configuração remota, marca a integração inicial como concluída e permite que o app controle
o transporte selecionado quando iniciar.

1. Abra _Configurações → Geral_.
2. Em **OpenClaw executa**, escolha **Remoto** e configure:
   - **Transporte**: **Túnel SSH** ou **Direto (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional).
     - Se o Gateway estiver na mesma LAN e anunciar Bonjour, escolha-o na lista descoberta para preencher esse campo automaticamente.
   - **URL do Gateway** (somente Direto): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Arquivo de identidade** (avançado): caminho para sua chave.
   - **Raiz do projeto** (avançado): caminho do checkout remoto usado para comandos.
   - **Caminho da CLI** (avançado): caminho opcional para um entrypoint/binário `openclaw` executável (preenchido automaticamente quando anunciado).
3. Pressione **Testar remoto**. Sucesso indica que o `openclaw status --json` remoto roda corretamente. Falhas geralmente significam problemas de PATH/CLI; o código de saída 127 significa que a CLI não foi encontrada remotamente.
4. As verificações de integridade e o Chat Web agora rodarão automaticamente pelo transporte selecionado.

## Chat Web

- **Túnel SSH**: o Chat Web se conecta ao Gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: o Chat Web se conecta diretamente à URL do Gateway configurada.
- Não há mais um servidor HTTP separado para WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações de TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Notificações). Execute a integração inicial nessa máquina para concedê-las uma vez.
- Os nós anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Observações de segurança

- Prefira vínculos de loopback no host remoto e conecte via SSH, Tailscale Serve ou uma URL direta confiável de Tailnet/LAN.
- O tunelamento SSH usa verificação estrita de chave de host; confie primeiro na chave do host para que ela exista em `~/.ssh/known_hosts`.
- Se você vincular o Gateway a uma interface que não seja loopback, exija autenticação válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade exibirá problemas de vínculo.

## Solução de problemas

- **código de saída 127 / não encontrado**: `openclaw` não está no PATH para shells sem login. Adicione-o a `/etc/paths`, ao rc do seu shell ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda de integridade falhou**: verifique o alcance via SSH, o PATH e se o Baileys está conectado (`openclaw status --json`).
- **Chat Web travado**: confirme que o Gateway está em execução no host remoto e que a porta encaminhada corresponde à porta WS do Gateway; a UI exige uma conexão WS saudável.
- **IP do nó mostra 127.0.0.1**: esperado com o túnel SSH. Troque **Transporte** para **Direto (ws/wss)** se quiser que o Gateway veja o IP real do cliente.
- **Dashboard funciona, mas os recursos do Mac estão offline**: isso significa que a conexão de operador/controle do app está íntegra, mas a conexão do nó complementar não está conectada ou está sem sua superfície de comandos. Abra a seção de dispositivo na barra de menus e verifique se o Mac está `paired · disconnected`. Para endpoints `wss://*.ts.net` do Tailscale Serve, o app detecta pins TLS legados obsoletos de certificado leaf após rotação de certificado, limpa o pin obsoleto quando o macOS confia no novo certificado e tenta novamente automaticamente. Se o certificado não for confiável pelo sistema ou o host não for um nome do Tailscale Serve, defina `gateway.remote.tlsFingerprint` como a impressão digital esperada do certificado, revise o certificado ou mude para **Remoto via SSH**.
- **Voice Wake**: frases de acionamento são encaminhadas automaticamente no modo remoto; nenhum encaminhador separado é necessário.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não há mais uma alternância global de "som padrão" no app; os chamadores escolhem um som (ou nenhum) por solicitação.

## Relacionado

- [app macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
