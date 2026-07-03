---
read_when:
    - Configurando ou depurando o controle remoto de Mac
summary: fluxo do aplicativo macOS para controlar um gateway OpenClaw remoto
title: Controle remoto
x-i18n:
    generated_at: "2026-07-03T23:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d1ac5065011ef16085b3349ee7224fe3e806a6de61feaac2dcd5c9ed264227e
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este fluxo permite que o app macOS atue como um controle remoto completo para um Gateway do OpenClaw em execução em outro host (desktop/servidor). O app pode se conectar diretamente a URLs confiáveis de Gateway em LAN/Tailnet ou gerenciar um túnel SSH quando o Gateway remoto é somente loopback. Verificações de integridade, encaminhamento do Voice Wake e Web Chat reutilizam a mesma configuração remota de _Configurações → Geral_.

## Modos

- **Local (este Mac)**: Tudo é executado no laptop. Sem SSH envolvido.
- **Remoto via SSH (padrão)**: Os comandos do OpenClaw são executados no host remoto. O app para Mac abre uma conexão SSH com `-o BatchMode`, além da identidade/chave escolhida e de um encaminhamento de porta local.
- **Remoto direto (ws/wss)**: Sem túnel SSH. O app para Mac se conecta diretamente à URL do Gateway (por exemplo, via LAN, Tailscale, Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

O modo remoto oferece suporte a dois transportes:

- **Túnel SSH** (padrão): Usa `ssh -N -L ...` para encaminhar a porta do Gateway para localhost. O Gateway verá o IP do Node como `127.0.0.1` porque o túnel é loopback.
- **Direto (ws/wss)**: Conecta diretamente à URL do Gateway. O Gateway vê o IP real do cliente.

O app desativa multiplexação de conexão SSH e execução em segundo plano após autenticação para processos SSH pertencentes ao app, para que possa monitorar e reiniciar o processo exato mesmo quando o alias selecionado habilita `ControlMaster` ou `ForkAfterAuthentication`.

A verificação de chave de host SSH é estrita por padrão porque as credenciais do Gateway trafegam por esse túnel. Para um alias SSH gerenciado cujo comportamento de confiança você pretende usar explicitamente, habilite com `openclaw-mac configure-remote --ssh-target <alias> --ssh-host-key-policy openssh` ou defina `gateway.remote.sshHostKeyPolicy` como `"openssh"`. Essa habilitação usa a política efetiva de chave de host do OpenSSH; revise primeiro o alias e qualquer configuração correspondente de `Host *` ou do sistema. Alterar o destino SSH no app ou com `configure-remote` redefine a política para `strict`, a menos que você habilite explicitamente de novo.

No modo de túnel SSH, nomes de host LAN/tailnet descobertos são salvos como
`gateway.remote.sshTarget`. O app mantém `gateway.remote.url` no endpoint local
do túnel, por exemplo `ws://127.0.0.1:18789`, para que a CLI, o Web Chat e
o serviço local de host do Node usem todos o mesmo transporte loopback seguro.
Quando a descoberta retorna tanto IPs brutos do Tailnet quanto nomes de host estáveis, o app
prefere nomes Tailscale MagicDNS ou LAN para que as conexões remotas sobrevivam melhor
a mudanças de endereço.
Se a porta local do túnel diferir da porta remota do Gateway, defina
`gateway.remote.remotePort` como a porta no host remoto.

A automação de navegador no modo remoto pertence ao host do Node da CLI, não ao
Node nativo do app macOS. O app inicia o serviço de host do Node instalado quando
possível; se você precisar de controle de navegador a partir desse Mac, instale/inicie-o com
`openclaw node install ...` e `openclaw node start` (ou execute
`openclaw node run ...` em primeiro plano) e então direcione para esse
Node com capacidade de navegador.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Garanta que `openclaw` esteja no PATH para shells não interativos (crie um symlink em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Somente para transporte SSH: abra o SSH com autenticação por chave. Recomendamos IPs do **Tailscale** para alcance estável fora da LAN.

## Configuração do app macOS

Para pré-configurar o app sem o fluxo de boas-vindas:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway.local \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Para um Gateway já acessível em uma LAN ou Tailnet confiável, ignore o SSH por completo:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Isso grava a configuração remota, marca a integração inicial como concluída e permite que o app controle
o transporte selecionado quando iniciar.

1. Abra _Configurações → Geral_.
2. Em **O OpenClaw é executado**, escolha **Remoto** e defina:
   - **Transporte**: **Túnel SSH** ou **Direto (ws/wss)**.
   - **Destino SSH**: `user@host` (`:port` opcional).
     - Se o Gateway estiver na mesma LAN e anunciar Bonjour, escolha-o na lista descoberta para preencher este campo automaticamente.
   - **URL do Gateway** (somente Direto): `wss://gateway.example.ts.net` (ou `ws://...` para local/LAN).
   - **Arquivo de identidade** (avançado): caminho para sua chave.
   - **Raiz do projeto** (avançado): caminho remoto do checkout usado para comandos.
   - **Caminho da CLI** (avançado): caminho opcional para um entrypoint/binário `openclaw` executável (preenchido automaticamente quando anunciado).
3. Clique em **Testar remoto**. Sucesso indica que o `openclaw status --json` remoto é executado corretamente. Falhas geralmente significam problemas de PATH/CLI; o código de saída 127 significa que a CLI não foi encontrada remotamente.
4. Verificações de integridade e Web Chat agora serão executados automaticamente pelo transporte selecionado.

## Web Chat

- **Túnel SSH**: O Web Chat se conecta ao Gateway pela porta de controle WebSocket encaminhada (padrão 18789).
- **Direto (ws/wss)**: O Web Chat se conecta diretamente à URL configurada do Gateway.
- Não há mais um servidor HTTP separado do WebChat.

## Permissões

- O host remoto precisa das mesmas aprovações TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala, Notificações). Execute a integração inicial nessa máquina para concedê-las uma vez.
- Nodes anunciam seu estado de permissão via `node.list` / `node.describe` para que os agentes saibam o que está disponível.

## Notas de segurança

- Prefira binds de loopback no host remoto e conecte via SSH, Tailscale Serve ou uma URL direta confiável de Tailnet/LAN.
- O tunelamento SSH exige por padrão uma chave de host já confiável. Confie primeiro na chave do host para que ela exista no arquivo known-hosts configurado, ou escolha explicitamente `gateway.remote.sshHostKeyPolicy: "openssh"` para um alias gerenciado cuja política de confiança do OpenSSH você aceita.
- Se você fizer bind do Gateway a uma interface não loopback, exija autenticação válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade usando `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --verbose` **no host remoto**. Escaneie o QR com o WhatsApp no seu telefone.
- Execute o login novamente nesse host se a autenticação expirar. A verificação de integridade exibirá problemas de vínculo.

## Solução de problemas

- **exit 127 / não encontrado**: `openclaw` não está no PATH para shells sem login. Adicione-o a `/etc/paths`, ao rc do seu shell, ou crie um symlink em `/usr/local/bin`/`/opt/homebrew/bin`.
- **Sonda de integridade falhou**: verifique o alcance SSH, o PATH e se o Baileys está logado (`openclaw status --json`).
- **Web Chat travado**: confirme que o Gateway está em execução no host remoto e que a porta encaminhada corresponde à porta WS do Gateway; a UI exige uma conexão WS íntegra.
- **IP do Node mostra 127.0.0.1**: esperado com o túnel SSH. Altere **Transporte** para **Direto (ws/wss)** se quiser que o Gateway veja o IP real do cliente.
- **Dashboard funciona, mas as capacidades do Mac estão offline**: isso significa que a conexão de operador/controle do app está íntegra, mas a conexão do Node complementar não está conectada ou não tem sua superfície de comandos. Abra a seção de dispositivo da barra de menus e verifique se o Mac está `paired · disconnected`. Para endpoints Tailscale Serve `wss://*.ts.net`, o app detecta pins TLS legados obsoletos após rotação de certificado, limpa o pin obsoleto quando o macOS confia no novo certificado e tenta novamente automaticamente. Se o certificado não for confiável pelo sistema ou o host não for um nome Tailscale Serve, defina `gateway.remote.tlsFingerprint` como a impressão digital esperada do certificado, revise o certificado ou mude para **Remoto via SSH**.
- **Voice Wake**: as frases de acionamento são encaminhadas automaticamente no modo remoto; nenhum encaminhador separado é necessário.

## Sons de notificação

Escolha sons por notificação a partir de scripts com `openclaw` e `node.invoke`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

Não há mais um alternador global de "som padrão" no app; os chamadores escolhem um som (ou nenhum) por solicitação.

## Relacionado

- [App macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
