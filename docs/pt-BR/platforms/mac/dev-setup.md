---
read_when:
    - Configurando o ambiente de desenvolvimento no macOS
summary: Guia de configuração para desenvolvedores que trabalham no aplicativo OpenClaw para macOS
title: Configuração de desenvolvimento no macOS
x-i18n:
    generated_at: "2026-05-06T09:05:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3ecf014bff10e8416f1586f731e30c9de4a0f09eb82046d06ead7511c47d660
    source_path: platforms/mac/dev-setup.md
    workflow: 16
---

# Configuração de desenvolvedor para macOS

Compile e execute o aplicativo OpenClaw para macOS a partir do código-fonte.

## Pré-requisitos

Antes de compilar o app, verifique se você tem os seguintes itens instalados:

1. **Xcode 26.2+**: necessário para desenvolvimento em Swift.
2. **Node.js 24 e pnpm**: recomendado para o gateway, a CLI e os scripts de empacotamento. Node 22 LTS, atualmente `22.14+`, continua compatível.

## 1. Instale as dependências

Instale as dependências de todo o projeto:

```bash
pnpm install
```

## 2. Compile e empacote o app

Para compilar o app para macOS e empacotá-lo em `dist/OpenClaw.app`, execute:

```bash
./scripts/package-mac-app.sh
```

Se você não tiver um certificado Apple Developer ID, o script usará automaticamente **assinatura ad-hoc** (`-`).

Para modos de execução de desenvolvimento, flags de assinatura e solução de problemas de Team ID, consulte o README do app para macOS:
[https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md](https://github.com/openclaw/openclaw/blob/main/apps/macos/README.md)

> **Observação**: apps assinados ad-hoc podem acionar avisos de segurança. Se o app falhar imediatamente com "Abort trap 6", consulte a seção [Solução de problemas](#troubleshooting).

## 3. Instale a CLI

O app para macOS espera uma instalação global da CLI `openclaw` para gerenciar tarefas em segundo plano.

**Para instalá-la (recomendado):**

1. Abra o app OpenClaw.
2. Vá para a aba de configurações **Geral**.
3. Clique em **"Instalar CLI"**.

Como alternativa, instale manualmente:

```bash
npm install -g openclaw@<version>
```

`pnpm add -g openclaw@<version>` e `bun add -g openclaw@<version>` também funcionam.
Para o runtime do Gateway, Node continua sendo o caminho recomendado.

## Solução de problemas

### A compilação falha: incompatibilidade de toolchain ou SDK

A compilação do app para macOS espera o SDK mais recente do macOS e a toolchain Swift 6.2.

**Dependências do sistema (obrigatórias):**

- **Versão mais recente do macOS disponível na Atualização de Software** (exigida pelos SDKs do Xcode 26.2)
- **Xcode 26.2** (toolchain Swift 6.2)

**Verificações:**

```bash
xcodebuild -version
xcrun swift --version
```

Se as versões não coincidirem, atualize o macOS/Xcode e execute a compilação novamente.

### O app falha ao conceder permissão

Se o app falhar quando você tentar permitir acesso ao **Reconhecimento de Fala** ou ao **Microfone**, isso pode ocorrer por causa de um cache TCC corrompido ou incompatibilidade de assinatura.

**Correção:**

1. Redefina as permissões do TCC:

   ```bash
   tccutil reset All ai.openclaw.mac.debug
   ```

2. Se isso falhar, altere temporariamente o `BUNDLE_ID` em [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) para forçar um "estado limpo" do macOS.

### Gateway "Iniciando..." indefinidamente

Se o status do gateway permanecer em "Iniciando...", verifique se um processo zumbi está mantendo a porta ocupada:

```bash
openclaw gateway status
openclaw gateway stop

# If you're not using a LaunchAgent (dev mode / manual runs), find the listener:
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

Se uma execução manual estiver mantendo a porta ocupada, pare esse processo (Ctrl+C). Como último recurso, encerre o PID encontrado acima.

## Relacionados

- [app para macOS](/pt-BR/platforms/macos)
- [Visão geral da instalação](/pt-BR/install)
