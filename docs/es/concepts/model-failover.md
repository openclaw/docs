---
read_when:
    - Diagnosticar la rotación de perfiles de autenticación, los tiempos de enfriamiento o el comportamiento de respaldo de modelos
    - Actualizar las reglas de respaldo para perfiles de autenticación o modelos
    - Comprender cómo las anulaciones de modelo de sesión interactúan con los reintentos de respaldo
sidebarTitle: Model failover
summary: Cómo OpenClaw rota los perfiles de autenticación y aplica respaldo entre modelos
title: Respaldo entre modelos
x-i18n:
    generated_at: "2026-04-26T11:27:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0e681a456f75073bb34e7af94234efeee57c6c25e9414da19eb9527ccba5444a
    source_path: concepts/model-failover.md
    workflow: 15
---

OpenClaw gestiona los fallos en dos etapas:

1. **Rotación de perfiles de autenticación** dentro del provider actual.
2. **Respaldo de modelo** al siguiente modelo en `agents.defaults.model.fallbacks`.

Este documento explica las reglas del runtime y los datos que las respaldan.

## Flujo del runtime

Para una ejecución normal de texto, OpenClaw evalúa los candidatos en este orden:

<Steps>
  <Step title="Resolver el estado de la sesión">
    Resuelve el modelo activo de la sesión y la preferencia de perfil de autenticación.
  </Step>
  <Step title="Construir la cadena de candidatos">
    Construye la cadena de candidatos de modelo a partir del modelo de sesión actualmente seleccionado, luego `agents.defaults.model.fallbacks` en orden, terminando con el primario configurado cuando la ejecución comenzó desde una anulación.
  </Step>
  <Step title="Probar el provider actual">
    Prueba el provider actual con reglas de rotación/enfriamiento de perfiles de autenticación.
  </Step>
  <Step title="Avanzar en errores aptos para respaldo">
    Si ese provider se agota con un error apto para respaldo, pasa al siguiente candidato de modelo.
  </Step>
  <Step title="Persistir la anulación de respaldo">
    Persiste la anulación de respaldo seleccionada antes de que comience el reintento para que otros lectores de la sesión vean el mismo provider/modelo que el ejecutor está a punto de usar.
  </Step>
  <Step title="Revertir de forma acotada en caso de fallo">
    Si el candidato de respaldo falla, revierte solo los campos de anulación de sesión propiedad del respaldo cuando todavía coinciden con ese candidato fallido.
  </Step>
  <Step title="Lanzar FallbackSummaryError si se agota">
    Si todos los candidatos fallan, lanza un `FallbackSummaryError` con detalles por intento y el vencimiento de enfriamiento más próximo cuando se conoce.
  </Step>
</Steps>

Esto es intencionadamente más acotado que “guardar y restaurar toda la sesión”. El ejecutor de respuestas solo persiste los campos de selección de modelo que controla para el respaldo:

- `providerOverride`
- `modelOverride`
- `authProfileOverride`
- `authProfileOverrideSource`
- `authProfileOverrideCompactionCount`

Eso evita que un reintento de respaldo fallido sobrescriba mutaciones de sesión no relacionadas y más recientes, como cambios manuales con `/model` o actualizaciones de rotación de sesión que ocurrieron mientras el intento estaba en ejecución.

## Almacenamiento de autenticación (claves + OAuth)

OpenClaw usa **perfiles de autenticación** tanto para claves de API como para tokens OAuth.

- Los secretos viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (heredado: `~/.openclaw/agent/auth-profiles.json`).
- El estado de enrutamiento de autenticación del runtime vive en `~/.openclaw/agents/<agentId>/agent/auth-state.json`.
- `auth.profiles` / `auth.order` en la configuración son **solo metadatos + enrutamiento** (sin secretos).
- Archivo OAuth heredado solo de importación: `~/.openclaw/credentials/oauth.json` (se importa a `auth-profiles.json` en el primer uso).

Más detalles: [OAuth](/es/concepts/oauth)

Tipos de credencial:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` para algunos providers)

## IDs de perfil

Los inicios de sesión con OAuth crean perfiles distintos para que varias cuentas puedan coexistir.

- Predeterminado: `provider:default` cuando no hay email disponible.
- OAuth con email: `provider:<email>` (por ejemplo `google-antigravity:user@gmail.com`).

Los perfiles viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` dentro de `profiles`.

## Orden de rotación

Cuando un provider tiene varios perfiles, OpenClaw elige un orden así:

<Steps>
  <Step title="Configuración explícita">
    `auth.order[provider]` (si está establecido).
  </Step>
  <Step title="Perfiles configurados">
    `auth.profiles` filtrado por provider.
  </Step>
  <Step title="Perfiles almacenados">
    Entradas en `auth-profiles.json` para el provider.
  </Step>
</Steps>

Si no hay un orden explícito configurado, OpenClaw usa un orden round-robin:

- **Clave primaria:** tipo de perfil (**OAuth antes que claves de API**).
- **Clave secundaria:** `usageStats.lastUsed` (el más antiguo primero, dentro de cada tipo).
- Los **perfiles en enfriamiento/deshabilitados** se mueven al final, ordenados por el vencimiento más cercano.

### Persistencia por sesión (favorable para caché)

OpenClaw **fija el perfil de autenticación elegido por sesión** para mantener calientes las cachés del provider. **No** rota en cada solicitud. El perfil fijado se reutiliza hasta que:

- la sesión se reinicia (`/new` / `/reset`)
- se completa una Compaction (el recuento de compactación se incrementa)
- el perfil entra en enfriamiento/deshabilitado

La selección manual mediante `/model …@<profileId>` establece una **anulación del usuario** para esa sesión y no rota automáticamente hasta que comience una sesión nueva.

<Note>
Los perfiles fijados automáticamente (seleccionados por el enrutador de sesión) se tratan como una **preferencia**: se prueban primero, pero OpenClaw puede rotar a otro perfil en límites de velocidad/tiempos de espera. Los perfiles fijados por el usuario permanecen bloqueados en ese perfil; si fallan y hay respaldos de modelo configurados, OpenClaw pasa al siguiente modelo en lugar de cambiar de perfil.
</Note>

### Por qué OAuth puede “parecer perdido”

Si tienes tanto un perfil OAuth como un perfil de clave de API para el mismo provider, el round-robin puede alternar entre ellos entre mensajes salvo que estén fijados. Para forzar un solo perfil:

- Fíjalo con `auth.order[provider] = ["provider:profileId"]`, o
- Usa una anulación por sesión mediante `/model …` con una anulación de perfil (cuando tu superficie de UI/chat lo admita).

## Tiempos de enfriamiento

Cuando un perfil falla por errores de autenticación/límite de velocidad (o un tiempo de espera que parece limitación de velocidad), OpenClaw lo marca en enfriamiento y pasa al siguiente perfil.

<AccordionGroup>
  <Accordion title="Qué entra en el grupo de límite de velocidad / tiempo de espera">
    Ese grupo de límite de velocidad es más amplio que un simple `429`: también incluye mensajes del provider como `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded`, `throttled`, `resource exhausted` y límites periódicos de ventana de uso como `weekly/monthly limit reached`.

    Los errores de formato/solicitud no válida (por ejemplo, errores de validación de ID de llamada de herramienta de Cloud Code Assist) se tratan como aptos para respaldo y usan los mismos tiempos de enfriamiento. Los errores de motivo de parada compatibles con OpenAI, como `Unhandled stop reason: error`, `stop reason: error` y `reason: error`, se clasifican como señales de tiempo de espera/respaldo.

    El texto genérico del servidor también puede entrar en ese grupo de tiempo de espera cuando el origen coincide con un patrón transitorio conocido. Por ejemplo, el mensaje simple `An unknown error occurred` del stream-wrapper de pi-ai se trata como apto para respaldo para todos los providers porque pi-ai lo emite cuando los flujos del provider terminan con `stopReason: "aborted"` o `stopReason: "error"` sin detalles específicos. Las cargas JSON `api_error` con texto transitorio del servidor, como `internal server error`, `unknown error, 520`, `upstream error` o `backend error`, también se tratan como tiempos de espera aptos para respaldo.

    El texto genérico ascendente específico de OpenRouter, como `Provider returned error`, se trata como tiempo de espera solo cuando el contexto del provider es realmente OpenRouter. El texto genérico interno de respaldo, como `LLM request failed with an unknown error.`, se mantiene conservador y no activa el respaldo por sí solo.

  </Accordion>
  <Accordion title="Límites de retry-after del SDK">
    Algunos SDK de provider podrían, de otro modo, dormir durante una ventana larga de `Retry-After` antes de devolver el control a OpenClaw. Para los SDK basados en Stainless como Anthropic y OpenAI, OpenClaw limita por defecto las esperas internas del SDK de `retry-after-ms` / `retry-after` a 60 segundos y muestra inmediatamente respuestas reintentables más largas para que esta ruta de respaldo pueda ejecutarse. Ajusta o desactiva el límite con `OPENCLAW_SDK_RETRY_MAX_WAIT_SECONDS`; consulta [Comportamiento de reintento](/es/concepts/retry).
  </Accordion>
  <Accordion title="Tiempos de enfriamiento con alcance de modelo">
    Los tiempos de enfriamiento por límite de velocidad también pueden tener alcance de modelo:

    - OpenClaw registra `cooldownModel` para fallos por límite de velocidad cuando se conoce el id del modelo que falló.
    - Un modelo hermano en el mismo provider aún puede probarse cuando el enfriamiento está acotado a un modelo diferente.
    - Las ventanas de facturación/deshabilitación siguen bloqueando todo el perfil en todos los modelos.

  </Accordion>
</AccordionGroup>

Los tiempos de enfriamiento usan retroceso exponencial:

- 1 minuto
- 5 minutos
- 25 minutos
- 1 hora (límite)

El estado se almacena en `auth-state.json` dentro de `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Deshabilitaciones por facturación

Los fallos de facturación/crédito (por ejemplo, “insufficient credits” / “credit balance too low”) se tratan como aptos para respaldo, pero normalmente no son transitorios. En lugar de un enfriamiento corto, OpenClaw marca el perfil como **disabled** (con un retroceso más largo) y rota al siguiente perfil/provider.

<Note>
No toda respuesta con forma de facturación es `402`, y no todo HTTP `402` entra aquí. OpenClaw mantiene el texto explícito de facturación en la vía de facturación incluso cuando un provider devuelve `401` o `403` en su lugar, pero los emparejadores específicos del provider siguen limitados al provider al que pertenecen (por ejemplo, OpenRouter `403 Key limit exceeded`).

Mientras tanto, los errores temporales `402` de ventana de uso y límite de gasto de organización/espacio de trabajo se clasifican como `rate_limit` cuando el mensaje parece reintentable (por ejemplo, `weekly usage limit exhausted`, `daily limit reached, resets tomorrow` o `organization spending limit exceeded`). Estos permanecen en la ruta de enfriamiento corto/respaldo en lugar de la ruta larga de deshabilitación por facturación.
</Note>

El estado se almacena en `auth-state.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Valores predeterminados:

- El retroceso de facturación empieza en **5 horas**, se duplica por cada fallo de facturación y se limita a **24 horas**.
- Los contadores de retroceso se reinician si el perfil no ha fallado durante **24 horas** (configurable).
- Los reintentos por sobrecarga permiten **1 rotación de perfil del mismo provider** antes del respaldo de modelo.
- Los reintentos por sobrecarga usan **0 ms de retroceso** de forma predeterminada.

## Respaldo de modelo

Si fallan todos los perfiles de un provider, OpenClaw pasa al siguiente modelo en `agents.defaults.model.fallbacks`. Esto se aplica a fallos de autenticación, límites de velocidad y tiempos de espera que agotaron la rotación de perfiles (otros errores no avanzan el respaldo).

Los errores de sobrecarga y límite de velocidad se manejan con más agresividad que los tiempos de enfriamiento por facturación. De forma predeterminada, OpenClaw permite una rotación de perfil de autenticación del mismo provider y luego cambia al siguiente respaldo de modelo configurado sin esperar. Las señales de provider ocupado, como `ModelNotReadyException`, entran en ese grupo de sobrecarga. Ajusta esto con `auth.cooldowns.overloadedProfileRotations`, `auth.cooldowns.overloadedBackoffMs` y `auth.cooldowns.rateLimitedProfileRotations`.

Cuando una ejecución comienza con una anulación de modelo (hooks o CLI), los respaldos siguen terminando en `agents.defaults.model.primary` después de probar cualquier respaldo configurado.

### Reglas de la cadena de candidatos

OpenClaw construye la lista de candidatos a partir del `provider/model` solicitado actualmente más los respaldos configurados.

<AccordionGroup>
  <Accordion title="Reglas">
    - El modelo solicitado siempre va primero.
    - Los respaldos configurados explícitamente se desduplican, pero no se filtran por la lista de permitidos de modelos. Se tratan como intención explícita del operador.
    - Si la ejecución actual ya está en un respaldo configurado de la misma familia de provider, OpenClaw sigue usando toda la cadena configurada.
    - Si la ejecución actual está en un provider diferente al de la configuración y ese modelo actual no forma ya parte de la cadena de respaldo configurada, OpenClaw no añade respaldos configurados no relacionados de otro provider.
    - Cuando la ejecución comenzó desde una anulación, el primario configurado se añade al final para que la cadena pueda volver a asentarse en el valor predeterminado normal una vez agotados los candidatos anteriores.

  </Accordion>
</AccordionGroup>

### Qué errores hacen avanzar el respaldo

<Tabs>
  <Tab title="Continúa con">
    - fallos de autenticación
    - límites de velocidad y agotamiento de enfriamiento
    - errores de sobrecarga/provider ocupado
    - errores de respaldo con forma de tiempo de espera
    - deshabilitaciones por facturación
    - `LiveSessionModelSwitchError`, que se normaliza en una ruta de respaldo para que un modelo persistido obsoleto no cree un bucle externo de reintento
    - otros errores no reconocidos cuando todavía quedan candidatos

  </Tab>
  <Tab title="No continúa con">
    - abortos explícitos que no tienen forma de tiempo de espera/respaldo
    - errores de desbordamiento de contexto que deben permanecer dentro de la lógica de Compaction/reintento (por ejemplo `request_too_large`, `INVALID_ARGUMENT: input exceeds the maximum number of tokens`, `input token count exceeds the maximum number of input tokens`, `The input is too long for the model` u `ollama error: context length exceeded`)
    - un error desconocido final cuando no quedan candidatos

  </Tab>
</Tabs>

### Comportamiento de omisión por enfriamiento frente a sondeo

Cuando todos los perfiles de autenticación de un provider ya están en enfriamiento, OpenClaw no omite automáticamente ese provider para siempre. Toma una decisión por candidato:

<AccordionGroup>
  <Accordion title="Decisiones por candidato">
    - Los fallos persistentes de autenticación omiten inmediatamente todo el provider.
    - Las deshabilitaciones por facturación normalmente se omiten, pero el candidato primario aún puede sondearse con limitación para que la recuperación sea posible sin reiniciar.
    - El candidato primario puede sondearse cerca del vencimiento del enfriamiento, con una limitación por provider.
    - Los hermanos de respaldo del mismo provider pueden intentarse a pesar del enfriamiento cuando el fallo parece transitorio (`rate_limit`, `overloaded` o desconocido). Esto es especialmente relevante cuando un límite de velocidad tiene alcance de modelo y un modelo hermano aún puede recuperarse de inmediato.
    - Los sondeos transitorios de enfriamiento se limitan a uno por provider por ejecución de respaldo para que un solo provider no bloquee el respaldo entre providers.

  </Accordion>
</AccordionGroup>

## Anulaciones de sesión y cambio de modelo en vivo

Los cambios de modelo de sesión son estado compartido. El ejecutor activo, el comando `/model`, las actualizaciones de Compaction/sesión y la conciliación de sesión en vivo leen o escriben partes de la misma entrada de sesión.

Eso significa que los reintentos de respaldo tienen que coordinarse con el cambio de modelo en vivo:

- Solo los cambios de modelo explícitos impulsados por el usuario marcan un cambio en vivo pendiente. Eso incluye `/model`, `session_status(model=...)` y `sessions.patch`.
- Los cambios de modelo impulsados por el sistema, como la rotación de respaldo, las anulaciones de Heartbeat o la Compaction, nunca marcan por sí mismos un cambio en vivo pendiente.
- Antes de que comience un reintento de respaldo, el ejecutor de respuestas persiste en la entrada de sesión los campos de anulación de respaldo seleccionados.
- La conciliación de sesión en vivo prefiere las anulaciones de sesión persistidas frente a campos obsoletos del modelo en runtime.
- Si el intento de respaldo falla, el ejecutor revierte solo los campos de anulación que escribió, y solo si todavía coinciden con ese candidato fallido.

Esto evita la carrera clásica:

<Steps>
  <Step title="Falla el primario">
    Falla el modelo primario seleccionado.
  </Step>
  <Step title="Se elige el respaldo en memoria">
    El candidato de respaldo se elige en memoria.
  </Step>
  <Step title="El almacén de sesión aún dice el primario anterior">
    El almacén de sesión todavía refleja el primario anterior.
  </Step>
  <Step title="La conciliación en vivo lee el estado obsoleto">
    La conciliación de sesión en vivo lee el estado obsoleto de la sesión.
  </Step>
  <Step title="El reintento vuelve al estado anterior">
    El reintento vuelve al modelo anterior antes de que comience el intento de respaldo.
  </Step>
</Steps>

La anulación de respaldo persistida cierra esa ventana, y la reversión acotada mantiene intactos los cambios de sesión manuales o de runtime más recientes.

## Observabilidad y resúmenes de fallo

`runWithModelFallback(...)` registra detalles por intento que alimentan los registros y los mensajes de enfriamiento visibles para el usuario:

- provider/modelo intentado
- razón (`rate_limit`, `overloaded`, `billing`, `auth`, `model_not_found` y razones de respaldo similares)
- estado/código opcional
- resumen legible por humanos del error

Cuando todos los candidatos fallan, OpenClaw lanza `FallbackSummaryError`. El ejecutor externo de respuestas puede usarlo para construir un mensaje más específico, como “todos los modelos están temporalmente limitados por velocidad”, e incluir el vencimiento de enfriamiento más próximo cuando se conoce.

Ese resumen de enfriamiento tiene en cuenta el modelo:

- se ignoran los límites de velocidad con alcance de modelo no relacionados para la cadena de provider/modelo intentada
- si el bloqueo restante es un límite de velocidad coincidente con alcance de modelo, OpenClaw informa del último vencimiento coincidente que todavía bloquea ese modelo

## Configuración relacionada

Consulta [Configuración del Gateway](/es/gateway/configuration) para:

- `auth.profiles` / `auth.order`
- `auth.cooldowns.billingBackoffHours` / `auth.cooldowns.billingBackoffHoursByProvider`
- `auth.cooldowns.billingMaxHours` / `auth.cooldowns.failureWindowHours`
- `auth.cooldowns.overloadedProfileRotations` / `auth.cooldowns.overloadedBackoffMs`
- `auth.cooldowns.rateLimitedProfileRotations`
- `agents.defaults.model.primary` / `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel` routing

Consulta [Models](/es/concepts/models) para la visión general más amplia de selección de modelos y respaldo.
