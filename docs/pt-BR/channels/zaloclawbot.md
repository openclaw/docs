---
read_when:
    - Você quer um bot assistente pessoal no Zalo com login por código QR
    - Você está instalando ou solucionando problemas do plugin de canal openclaw-zaloclawbot
summary: Configuração do canal Zalo ClawBot por meio do plugin externo openclaw-zaloclawbot
title: ClawBot do Zalo
x-i18n:
    generated_at: "2026-07-12T14:56:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 76c9f79d114856b86026a5e4b98a43f451b0d3f16dd41a67e9226da4f8b37b33
    source_path: channels/zaloclawbot.md
    workflow: 16
---

OpenClaw se conecta ao Zalo ClawBot por meio do plugin externo `@zalo-platforms/openclaw-zaloclawbot`, listado no catálogo. O login usa um código QR de um Zalo Mini App; o id do plugin na configuração é `openclaw-zaloclawbot`.

## Compatibilidade

| Versão do plugin | Versão do OpenClaw | dist-tag do npm | Status       |
| ---------------- | ------------------ | --------------- | ------------ |
| 0.1.4            | >=2026.4.10        | `latest`        | Ativo / Beta |

## Pré-requisitos

- Node.js >= 22
- [OpenClaw](https://docs.openclaw.ai/install) instalado (CLI `openclaw` disponível)
- Uma conta do Zalo em um dispositivo móvel para escanear o código QR de login

## Instalação com o onboarding (recomendado)

```bash
openclaw onboard
```

Selecione **Zalo ClawBot** no menu de canais. O assistente instala o plugin a partir do catálogo oficial (com integridade verificada), exibe o código QR de login no terminal e conclui a configuração do canal depois que você o escaneia com o aplicativo Zalo.

## Instalação manual

Para adicionar o canal a um Gateway que já passou pelo onboarding:

### 1. Instale o plugin

```bash
openclaw plugins install "@zalo-platforms/openclaw-zaloclawbot@0.1.4"
```

Use exatamente a versão fixada para que o OpenClaw verifique o pacote em relação ao hash de integridade do catálogo durante a instalação.

### 2. Ative o plugin na configuração

```bash
openclaw config set plugins.entries.openclaw-zaloclawbot.enabled true
```

### 3. Gere um código QR e faça login

```bash
openclaw channels login --channel openclaw-zaloclawbot
```

Escaneie o código QR exibido no terminal com o aplicativo móvel Zalo, aceite os Termos de Uso no Zalo Mini App e autorize a sessão.

### 4. Reinicie o Gateway

```bash
openclaw gateway restart
```

## Como funciona

Ao contrário do canal Zalo padrão, que exige o registro da sua própria Zalo Official Account (OA) e a configuração de credenciais estáticas de desenvolvedor, o Zalo ClawBot é um **assistente pessoal vinculado ao proprietário** em uma infraestrutura oficial compartilhada:

1. **Onboarding:** o código QR direciona para um Zalo Mini App que vincula diretamente ao seu ID de usuário do Zalo um bot privado recém-provisionado em uma OA oficial compartilhada.
2. **Privacidade vinculada ao proprietário:** o bot se comunica apenas com seu proprietário. As mensagens de outros usuários são descartadas no nível da plataforma.
3. **Caminho pela API oficial:** o plugin usa as APIs da Zalo Bot Platform, e não automação de navegador ou de sessão web.

## Funcionamento interno

O plugin se comunica com o Zalo por meio de um loop persistente de long polling (`getUpdates`). Webhooks ficam desativados por padrão em execuções locais do Gateway no desktop ou terminal. As mensagens são processadas no lado do cliente e mapeadas para o runtime local do seu agente.

O plugin gerencia as credenciais do bot no diretório de estado do OpenClaw. Trate esse diretório como confidencial e aplique a ele a mesma política de controle de acesso e backup usada para o restante do estado do OpenClaw.

O runtime deste plugin reside inteiramente no pacote externo `@zalo-platforms/openclaw-zaloclawbot`; os detalhes de comportamento abaixo, além da instalação e configuração, são os informados pelos mantenedores do plugin e não foram verificados em relação ao código-fonte do núcleo do OpenClaw.

## Solução de problemas

- **Tempo limite do login por QR:** o token de login (`zbsk`) expira após 5 minutos por motivos de segurança. Se o código QR expirar antes de ser escaneado, execute novamente o comando de login para gerar um novo.
- **Falha ao carregar o Gateway:** confirme que a versão do host do OpenClaw é `2026.4.10` ou superior. Versões anteriores não oferecem suporte ao registro de instalação de plugins npm externos exigido por este ID.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Zalo](/pt-BR/channels/zalo) - o canal integrado Zalo Bot Creator / Marketplace
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Plugins](/pt-BR/tools/plugin) - instalação e gerenciamento de plugins
