---
read_when:
    - Você quer um bot assistente pessoal do Zalo com login por código QR
    - Você está instalando ou solucionando problemas do plugin de canal openclaw-zaloclawbot
summary: Configuração do canal Zalo ClawBot por meio do Plugin externo openclaw-zaloclawbot
title: Zalo ClawBot
x-i18n:
    generated_at: "2026-06-27T17:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 982ae27b58af013bb5398266837698052b30337df0fe132f7cdfc5b66f561a99
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se conecta ao Zalo ClawBot por meio do Plugin externo
`@zalo-platforms/openclaw-zaloclawbot` listado no catálogo. O login usa um código QR
do Zalo Mini App.

## Compatibilidade

| Versão do Plugin | Versão do OpenClaw | npm dist-tag | Status       |
| ---------------- | ------------------ | ------------ | ------------ |
| 0.1.x            | >=2026.4.10        | `latest`     | Ativo / Beta |

## Pré-requisitos

- Node.js **>= 22**
- [OpenClaw](https://docs.openclaw.ai/install) deve estar instalado (CLI `openclaw` disponível).
- Uma conta Zalo em um dispositivo móvel para escanear o código QR de login.

## Instalar com onboard (recomendado)

Execute o assistente de integração do OpenClaw e escolha **Zalo ClawBot** no menu de canais:

```bash
openclaw onboard
```

O assistente instala o Plugin a partir do catálogo oficial (com integridade verificada), renderiza o QR de login diretamente no terminal e conclui o canal assim que você o escaneia com o app Zalo. Nenhum comando extra é necessário.

## Instalação manual

Para adicionar o canal a um Gateway já integrado, siga estas etapas:

### 1. Instale o Plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Use a versão fixada exata mostrada acima (ela corresponde à entrada do catálogo oficial), para que o OpenClaw verifique o pacote em relação ao hash de integridade do catálogo durante a instalação.

### 2. Habilite o Plugin na configuração

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Gere o código QR e faça login

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Escaneie o código QR renderizado no terminal usando o app móvel Zalo, aceite os Termos de Uso dentro do Zalo Mini App e autorize a sessão.

### 4. Reinicie o Gateway

```bash
openclaw gateway restart
```

---

## Como funciona

Diferentemente do canal Zalo padrão para desenvolvedores, que exige que você registre sua própria Conta Oficial Zalo (OA) e cole credenciais estáticas de desenvolvedor, o Zalo ClawBot opera como um **assistente pessoal vinculado ao proprietário** usando uma infraestrutura oficial compartilhada:

1. **Integração segura:** O código QR resolve para um Zalo Mini App seguro que vincula um bot privado recém-provisionado, sob uma OA oficial compartilhada, diretamente ao seu ID de usuário Zalo.
2. **Privacidade vinculada ao proprietário:** Por design, o bot é restrito a se comunicar _somente_ com seu proprietário. Mensagens de outros usuários são descartadas no nível da plataforma, tornando a conexão privada e segura.
3. **Caminho de API oficial:** O Plugin usa APIs da Zalo Bot Platform em vez de
   automação de navegador ou sessão web.

## Por dentro

O Plugin Zalo ClawBot se comunica com as APIs da Zalo por meio de um loop persistente de mensagens com long polling. Para manter um runtime limpo e leve:

- Conexões de long polling utilizam o endpoint `getUpdates`.
- Webhooks são desabilitados por padrão para execuções locais do Gateway em desktop/terminal.
- As mensagens são processadas no lado do cliente e mapeadas diretamente para o runtime do seu agente local.

O Plugin externo gerencia credenciais de bot no diretório de estado do OpenClaw.
Trate esse diretório como sensível e inclua-o na mesma política de controle de acesso e
backup do restante do seu estado do OpenClaw.

---

## Solução de problemas

- **Tempo limite do login por QR:** O token de login (`zbsk`) expira após 5 minutos por motivos de segurança. Se o código QR expirar antes de você escaneá-lo, basta executar novamente o comando de login para gerar um novo.
- **Gateway não carrega:** Verifique se a versão do host OpenClaw é `2026.4.10` ou superior. Versões mais antigas não oferecem suporte ao registro de instalação de Plugins npm externos.
