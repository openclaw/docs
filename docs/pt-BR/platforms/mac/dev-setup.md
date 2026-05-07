---
read_when:
    - Configuração do ambiente de desenvolvimento no macOS
summary: Guia de configuração para desenvolvedores que trabalham no app macOS do OpenClaw
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-05-07T13:20:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b39b449570176f44305c98ec4f00482a8b75ad20174b80c93abc45df37ffa0bc
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração de desenvolvedor do macOS

Compile e execute o aplicativo macOS do OpenClaw a partir do código-fonte.

## Pré-requisitos

Antes de compilar o app, verifique se você tem os seguintes itens instalados:

1. **Xcode 26.2+**: Necessário para desenvolvimento em Swift.
2. **Node.js 24 e pnpm**: Recomendado para o gateway, a CLI e os scripts de empacotamento. Node 22 LTS, atualmente `22.16+`, continua compatível.

## 1. Instale as dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compile e empacote o app

Para compilar o app macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado de Apple Developer ID, o script usará automaticamente a **assinatura ad-hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas de Team ID, consulte o README do app macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: apps assinados de forma ad-hoc podem acionar avisos de segurança. Se o app falhar imediatamente com "Abort trap 6", consulte a seção [Solução de problemas](#troubleshooting).

## 3. Instale a CLI

O app macOS espera uma instalação global da CLI `openclaw` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o app OpenClaw.
2. Vá para a aba de configurações **General**.
3. Clique em **"Install CLI"**.

Como alternativa, instale manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, Node continua sendo o caminho recomendado.

## Solução de problemas

### Falha na compilação: incompatibilidade de toolchain ou SDK

A compilação do app macOS espera o SDK mais recente do macOS e a toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Versão mais recente do macOS disponível na Atualização de Software** (exigida pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não corresponderem, atualize o macOS/Xcode e execute a compilação novamente.

### O app falha ao conceder permissão

Se o app falhar quando você tentar permitir acesso a **Speech Recognition** ou **Microphone**, isso pode ocorrer devido a um cache TCC corrompido ou uma incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "começo limpo" do macOS.

### Gateway em "Starting..." indefinidamente

Se o status do gateway permanecer em "Starting...", verifique se um processo zumbi está ocupando a porta:

```bash
openclaw gateway status
openclaw gateway stop

# Se você não estiver usando um LaunchAgent (modo dev / execuções manuais), encontre o listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver ocupando a porta, interrompa esse processo (Ctrl+C). Como último recurso, encerre o PID encontrado acima.

## Relacionado

- [App macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
