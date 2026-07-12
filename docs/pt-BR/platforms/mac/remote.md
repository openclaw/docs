---
read_when:
    - Configurando ou depurando o controle remoto do Mac
summary: Fluxo do aplicativo para macOS para controlar um Gateway remoto do OpenClaw
title: Controle remoto
x-i18n:
    generated_at: "2026-07-12T15:21:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: bd3ee71838737c1b8cf67d91d00b135283f4284400c75309646e62921e8c3633
    source_path: platforms/mac/remote.md
    workflow: 16
---

Este fluxo permite que o aplicativo para macOS funcione como um controle remoto completo para um Gateway do OpenClaw executado em outro host (desktop/servidor). O aplicativo se conecta diretamente a URLs confiáveis do Gateway na LAN/Tailnet ou gerencia um túnel SSH quando o Gateway remoto aceita conexões apenas via loopback. As verificações de integridade, o encaminhamento da Ativação por Voz e o Web Chat reutilizam a mesma configuração remota de _Settings -> General_.

## Modos

- **Local (este Mac)**: tudo é executado no laptop; sem uso de SSH.
- **Remoto via SSH (padrão)**: os comandos do OpenClaw são executados no host remoto. O aplicativo abre uma conexão SSH com `-o BatchMode`, a identidade/chave escolhida e um encaminhamento de porta local.
- **Remoto direto (ws/wss)**: sem túnel SSH; o aplicativo se conecta diretamente à URL do Gateway (LAN, Tailscale, Tailscale Serve ou um proxy reverso HTTPS público).

## Transportes remotos

- **Túnel SSH** (padrão): usa `ssh -N -L ...` para encaminhar a porta do Gateway ao localhost. O Gateway vê o IP do Node como `127.0.0.1` porque o túnel usa loopback.
- **Direto (ws/wss)**: conecta-se diretamente à URL do Gateway. O Gateway vê o IP real do cliente.

O aplicativo desativa a multiplexação de conexões SSH e a execução em segundo plano após a autenticação em seus próprios processos SSH, para poder monitorar e reiniciar o processo exato, mesmo que o alias selecionado habilite `ControlMaster` ou `ForkAfterAuthentication`.

A verificação da chave de host SSH é rigorosa por padrão porque as credenciais do Gateway trafegam por esse túnel. Para optar pelo comportamento de confiança próprio de um alias SSH gerenciado, defina `--ssh-host-key-policy openssh` por meio de `openclaw-mac configure-remote` ou defina `gateway.remote.sshHostKeyPolicy` diretamente como `"openssh"`. Revise o alias e qualquer configuração correspondente de `Host *` ou do sistema antes de optar por isso. Alterar o destino SSH (no aplicativo ou por meio de `configure-remote`) redefine a política como `strict`, a menos que você opte explicitamente por ela novamente para o novo destino.

No modo de túnel SSH, os nomes de host descobertos na LAN/Tailnet são salvos como `gateway.remote.sshTarget`. O aplicativo mantém `gateway.remote.url` no endpoint do túnel local (por exemplo, `ws://127.0.0.1:18789`), para que a CLI, o Web Chat e o serviço de host do Node local usem o mesmo transporte de loopback. Quando a descoberta retorna tanto IPs brutos da Tailnet quanto nomes de host estáveis, o aplicativo prefere nomes do Tailscale MagicDNS ou da LAN, para que as conexões resistam melhor a alterações de endereço. Se a porta do túnel local for diferente da porta do Gateway remoto, defina `gateway.remote.remotePort` como a porta no host remoto.

A automação do navegador no modo remoto pertence ao host do Node da CLI, não ao Node do aplicativo nativo para macOS. O aplicativo inicia o serviço de host do Node instalado quando possível; para habilitar o controle do navegador nesse Mac, instale/inicie-o com `openclaw node install ...` e `openclaw node start` (ou execute `openclaw node run ...` em primeiro plano) e, em seguida, use como destino esse Node com suporte a navegador.

## Pré-requisitos no host remoto

1. Instale Node + pnpm e compile/instale a CLI do OpenClaw (`pnpm install && pnpm build && pnpm link --global`).
2. Verifique se `openclaw` está no PATH para shells não interativos (crie um link simbólico em `/usr/local/bin` ou `/opt/homebrew/bin`, se necessário).
3. Para o transporte SSH: configure a autenticação SSH baseada em chave. IPs do Tailscale são recomendados para uma conectividade estável fora da LAN.

## Configuração do aplicativo para macOS

Para pré-configurar o aplicativo sem o fluxo de boas-vindas, via SSH:

```bash
openclaw-mac configure-remote \
  --ssh-target user@gateway-host \
  --local-port 18789 \
  --remote-port 18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ou, para um Gateway que já esteja acessível em uma LAN ou Tailnet confiável, ignore completamente o SSH:

```bash
openclaw-mac configure-remote \
  --direct-url ws://192.168.0.202:18789 \
  --token "$OPENCLAW_GATEWAY_TOKEN"
```

As duas formas gravam `~/.openclaw/openclaw.json`, marcam a integração inicial como concluída e permitem que o aplicativo gerencie o transporte selecionado na próxima inicialização. Os valores padrão de `--local-port`/`--remote-port` são `18789`. Outras opções: `--password`, `--identity <path>`, `--ssh-host-key-policy <strict|openssh>`, `--project-root <path>`, `--cli-path <path>`, `--json`. Execute `openclaw-mac configure-remote --help` para consultar a referência completa.

Para configurar pela interface:

1. Abra _Settings -> General_.
2. Em **OpenClaw runs**, selecione **Remote** e defina:
   - **Transport**: **SSH tunnel** ou **Direct (ws/wss)**.
   - **SSH target**: `user@host` (`:port` opcional). Se o Gateway estiver na mesma LAN e anunciar via Bonjour, selecione-o na lista de dispositivos descobertos para preencher este campo automaticamente.
   - **Gateway URL** (somente Direct): `wss://gateway.example.ts.net` (ou `ws://...` para rede local/LAN).
   - **Identity file** (avançado): caminho para sua chave.
   - **Project root** (avançado): caminho remoto do checkout usado para os comandos.
   - **CLI path** (avançado): caminho opcional para um ponto de entrada/binário executável do `openclaw` (preenchido automaticamente quando anunciado).
3. Clique em **Test remote**. O sucesso significa que `openclaw status --json` foi executado corretamente no host remoto. As falhas geralmente indicam problemas com PATH/CLI; o código de saída 127 significa que a CLI não foi encontrada no host remoto.
4. As verificações de integridade e o Web Chat agora são executados automaticamente pelo transporte selecionado.

## Web Chat

- **Túnel SSH**: conecta-se ao Gateway pela porta de controle WebSocket encaminhada (padrão: 18789).
- **Direto (ws/wss)**: conecta-se diretamente à URL configurada do Gateway.
- Não há um servidor HTTP separado para o Web Chat.

## Permissões

- O host remoto precisa das mesmas aprovações TCC que o local (Automação, Acessibilidade, Gravação de Tela, Microfone, Reconhecimento de Fala e Notificações). Execute a integração inicial nessa máquina uma vez para concedê-las.
- Os Nodes anunciam o estado de suas permissões por meio de `node.list` / `node.describe`, para que os agentes saibam o que está disponível.

## Observações de segurança

- Prefira associações de loopback no host remoto e conecte-se via SSH, Tailscale Serve ou uma URL direta confiável da Tailnet/LAN.
- Por padrão, o túnel SSH exige uma chave de host já confiável. Primeiro, confie na chave de host (adicione-a ao arquivo de hosts conhecidos configurado) ou defina explicitamente `gateway.remote.sshHostKeyPolicy: "openssh"` para um alias gerenciado cuja política de confiança do OpenSSH você aceite.
- Se você associar o Gateway a uma interface que não seja de loopback, exija uma autenticação válida do Gateway: token, senha ou um proxy reverso com reconhecimento de identidade e `gateway.auth.mode: "trusted-proxy"`.
- Consulte [Segurança](/pt-BR/gateway/security) e [Tailscale](/pt-BR/gateway/tailscale).

## Fluxo de login do WhatsApp (remoto)

- Execute `openclaw channels login --channel whatsapp --verbose` **no host remoto**. Leia o código QR com o WhatsApp no seu telefone.
- Execute novamente o login nesse host se a autenticação expirar. A verificação de integridade mostra problemas de vinculação.

## Solução de problemas

| Sintoma                                          | Causa / correção                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exit 127` / não encontrado                      | `openclaw` não está no PATH para shells que não são de login. Adicione-o a `/etc/paths`, ao arquivo rc do seu shell ou crie um link simbólico em `/usr/local/bin`/`/opt/homebrew/bin`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Falha na sondagem de integridade                  | Verifique a conectividade SSH, o PATH e se o Baileys (WhatsApp) está conectado (`openclaw status --json`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Chat Web travado                                  | Confirme se o Gateway está em execução no host remoto e se a porta encaminhada corresponde à porta WS do Gateway; a interface exige uma conexão WS íntegra.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| O IP do Node mostra `127.0.0.1`                  | Isso é esperado com o túnel SSH. Altere **Transport** para **Direct (ws/wss)** se quiser que o Gateway veja o IP real do cliente.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| O painel funciona, mas os recursos do Mac estão offline | A conexão de operador/controle está íntegra, mas a conexão do Node complementar não está estabelecida ou não possui sua superfície de comandos. Abra a seção de dispositivos na barra de menus e verifique se o Mac aparece como `paired · disconnected`. Para endpoints do Tailscale Serve no formato `wss://*.ts.net`, o aplicativo detecta pins de certificado TLS folha legados e obsoletos após a rotação do certificado, remove o pin obsoleto assim que o macOS confia no novo certificado e tenta novamente de forma automática. Se o certificado não for confiável para o sistema ou o host não for um nome do Tailscale Serve, defina `gateway.remote.tlsFingerprint` como a impressão digital esperada do certificado, revise o certificado ou altere para **Remote over SSH**. |
| Ativação por voz                                  | As frases de ativação são encaminhadas automaticamente no modo remoto; não é necessário um encaminhador separado.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Sons de notificação

Escolha os sons por notificação nos scripts com `openclaw nodes notify`, por exemplo:

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Gateway remoto pronto" --sound Glass
```

Não há uma opção global de som padrão no aplicativo; os chamadores escolhem um som (ou nenhum) para cada solicitação.

## Relacionado

- [Aplicativo para macOS](/pt-BR/platforms/macos)
- [Acesso remoto](/pt-BR/gateway/remote)
