# API Endpoints para Encargados - Documentación

Estos endpoints permiten que un agente de IA (n8n) consulte datos del equipo de vendedores asignados a un encargado específico.

## Flujo de Integración: Chat del Encargado → n8n → API Endpoints

### 1. Mensaje desde el Chat del Encargado

Cuando el encargado envía un mensaje desde `/app/manager/chat`, el frontend envía a `/api/chat`:

```json
{
  "message": "¿Cuántos cierres tiene Sebastian este mes?",
  "context": {
    "role": "encargado",
    "selectedVendedor": "uuid-de-sebastian",  // o null si seleccionó "Equipo completo"
    "selectedVendedorName": "Sebastian Deya",
    "vendedorIds": ["uuid-sebastian", "uuid-jose"]  // todos los vendedores asignados
  }
}
```

### 2. Webhook a n8n

El endpoint `/api/chat` detecta que el usuario es encargado y envía al webhook configurado en `N8N_MANAGER_WEBHOOK_URL`:

```json
{
  "message": "¿Cuántos cierres tiene Sebastian este mes?",
  "userId": "uuid-del-encargado",
  "userName": "Pedro Gomez",
  "chatHistory": [...],  // últimos 20 mensajes
  "context": {
    "role": "encargado",
    "selectedVendedor": "uuid-de-sebastian",
    "selectedVendedorName": "Sebastian Deya",
    "vendedorIds": ["uuid-sebastian", "uuid-jose"]
  }
}
```

**Headers enviados:**
- `Content-Type: application/json`
- `x-n8n-secret: <tu-secret-compartido>` (configurado en `N8N_CHAT_SECRET`)

### 3. Workflow de n8n

Tu workflow de n8n recibe el webhook y debe:

1. **Extraer la información del contexto:**
   - `context.selectedVendedor`: UUID del vendedor seleccionado (null = equipo completo)
   - `userId`: UUID del encargado (para usar como `managerId`)

2. **Llamar a los endpoints de la API según la consulta:**
   - Si la pregunta es sobre cierres → `POST /api/agent/manager/cierres`
   - Si es sobre objetivos → `POST /api/agent/manager/objetivos`
   - Si es resumen general → `POST /api/agent/manager/resumen`

3. **Construir la respuesta:**
   - Procesar los datos del endpoint
   - Generar una respuesta en lenguaje natural usando IA
   - Retornar al chat del encargado

### Ejemplo de Workflow n8n

```
[Webhook] → [Clasificar Intención] → [HTTP Request] → [AI LLM] → [Response]
```

**HTTP Request Node (ejemplo para cierres):**
```
Method: POST
URL: https://tu-dominio.vercel.app/api/agent/manager/cierres
Headers:
  - x-agent-secret: {{$env.AGENT_SECRET}}
  - Content-Type: application/json
Body:
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}",  // null si es equipo completo
  "mes": 6,
  "anio": 2025
}
```

---

## Autenticación

Todos los endpoints requieren:

**Header:**
```
x-agent-secret: <tu_secret_compartido>
```

Este secret debe coincidir con la variable de entorno `AGENT_SECRET` configurada en el proyecto.

---

## Parámetros Comunes

**Body (JSON):**
- `managerId` (string, UUID, **requerido**): ID del usuario con rol "encargado"
- `vendedorId` (string, UUID, opcional): Si se especifica, filtra los resultados solo a ese vendedor (debe estar asignado al encargado)

**Validaciones automáticas:**
1. Verifica que el `managerId` exista y tenga rol `encargado`
2. Obtiene automáticamente todos los vendedores asignados al encargado desde `manager_vendedores`
3. Si se pasa `vendedorId`, valida que esté asignado al encargado
4. Retorna 404 si el encargado no tiene vendedores asignados

---

## Endpoints Disponibles

### 1. **POST /api/agent/manager/vendedores**

**Uso desde n8n:** Obtener la lista de vendedores cuando el encargado pregunta "¿Quiénes están en mi equipo?" o necesitas validar nombres de vendedores.

**Cuándo llamarlo:**
- Queries sobre "mi equipo", "mis vendedores"
- Para resolver nombres a UUIDs
- Para mostrar resumen del equipo

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}"  // opcional
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "full_name": "Sebastian Deya",
      "role": "vendedor",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": { "count": 1 }
}
```

---

### 2. **POST /api/agent/manager/cierres**

**Uso desde n8n:** Cuando el encargado pregunta sobre operaciones cerradas, facturación, comisiones, o puntas.

**Cuándo llamarlo:**
- "¿Cuántos cierres tuvo Sebastian este mes?"
- "¿Cuál fue la facturación del equipo en junio?"
- "Dame las comisiones del último trimestre"
- "¿Cuántas puntas hicimos este año?"

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}",
  "mes": 6,      // extraer de la consulta o fecha actual
  "anio": 2025   // extraer de la consulta o año actual
}
```

**Filtros de fecha (usa el más apropiado):**
- `mes` + `anio`: Mes específico
- `anio`: Todo el año
- `desde` + `hasta`: Rango de fechas
- Sin filtros: Todos los cierres históricos

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "fecha": "2025-06-15",
      "tipo": "Compraventa",
      "valor_cierre": 150000,
      "puntas": 1.5,
      "honorarios_calculados": 4500,
      "comision_calculada": 2250,
      "captacion": {
        "direccion": "Calle Falsa 123",
        "operacion": "venta",
        "oferta": 150000
      }
    }
  ],
  "meta": { "count": 1 }
}
```

---

### 3. **POST /api/agent/manager/captaciones**

**Uso desde n8n:** Cuando el encargado pregunta sobre propiedades en cartera, inventario, o captaciones disponibles.

**Cuándo llamarlo:**
- "¿Cuántas propiedades tiene Sebastian en cartera?"
- "Dame las captaciones de venta del equipo"
- "¿Qué propiedades están sin cerrar?"

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}",
  "operacion": "venta",     // "venta", "alquiler", "emprendimiento" (opcional)
  "conCierre": false        // true = cerradas, false = sin cerrar (opcional)
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "direccion": "Av. Principal 456",
      "operacion": "venta",
      "oferta": 120000,
      "honorarios_totales": 3600,
      "fecha_cierre": null,
      "estado": "En proceso"
    }
  ],
  "meta": { "count": 1 }
}
```

---

### 4. **POST /api/agent/manager/trackeo**

**Uso desde n8n:** Cuando el encargado pregunta sobre actividad diaria, llamadas, visitas, o captaciones nuevas.

**Cuándo llamarlo:**
- "¿Cuántas llamadas hizo Jose esta semana?"
- "Dame las visitas del equipo en mayo"
- "¿Cuántas captaciones nuevas hubo hoy?"

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}",
  "mes": 6,
  "anio": 2025
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "fecha": "2025-06-20",
      "llamadas": 15,
      "visitas": 3,
      "captaciones": 1
    }
  ],
  "meta": { "count": 1 }
}
```

---

### 5. **POST /api/agent/manager/objetivos**

**Uso desde n8n:** Cuando el encargado pregunta sobre metas, objetivos, o distribución mensual.

**Cuándo llamarlo:**
- "¿Cuál es el objetivo de Sebastian para este año?"
- "Dame los pesos mensuales del equipo"
- "¿Cuántas puntas tiene que hacer Jose?"

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "vendedorId": "{{$json.context.selectedVendedor}}",
  "anio": 2025
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "anio": 2025,
      "objetivo_puntas": 24,
      "objetivo_facturacion_total": 108000,
      "objetivo_comisiones_agente": 54000,
      "peso_mensual_1": 5,
      "peso_mensual_2": 7,
      ...
      "peso_mensual_12": 7
    }
  ],
  "meta": { "count": 1 }
}
```

---

### 6. **POST /api/agent/manager/resumen**

**Uso desde n8n:** Cuando el encargado pide un overview completo, comparativa entre vendedores, o análisis de rendimiento.

**Cuándo llamarlo:**
- "Dame el resumen del equipo"
- "¿Cómo va el cumplimiento de objetivos?"
- "Compara el desempeño de Sebastian vs Jose"
- "¿Quién está más cerca de su objetivo?"

**Body:**
```json
{
  "managerId": "{{$json.userId}}",
  "anio": 2025
}
```

**Respuesta:**
```json
{
  "ok": true,
  "data": {
    "anio": 2025,
    "equipo": {
      "vendedores": 2,
      "total_cierres": 15,
      "total_honorarios": 67500,
      "total_comisiones": 33750,
      "total_puntas": 22.5,
      "total_captaciones_cartera": 45,
      "total_llamadas": 350,
      "total_visitas": 65
    },
    "vendedores": [
      {
        "userId": "uuid",
        "nombre": "Sebastian Deya",
        "cierres": 8,
        "honorarios": 36000,
        "comisiones": 18000,
        "puntas": 12,
        "captaciones_en_cartera": 23,
        "llamadas": 180,
        "visitas": 35,
        "objetivo_facturacion": 108000,
        "objetivo_puntas": 24,
        "pct_facturacion": 33.33,
        "pct_puntas": 50.0
      },
      {
        "userId": "uuid",
        "nombre": "Jose Garcia",
        "cierres": 7,
        "honorarios": 31500,
        "comisiones": 15750,
        "puntas": 10.5,
        "captaciones_en_cartera": 22,
        "llamadas": 170,
        "visitas": 30,
        "objetivo_facturacion": 108000,
        "objetivo_puntas": 24,
        "pct_facturacion": 29.17,
        "pct_puntas": 43.75
      }
    ]
  },
  "meta": { "count": 2 }
}
```

**Ideal para:** Dashboards consolidados, comparativas, y análisis de cumplimiento de objetivos.

---

## Manejo de Errores

**401 Unauthorized:**
```json
{ "ok": false, "error": "Unauthorized" }
```
Causa: `x-agent-secret` header faltante o incorrecto

**400 Bad Request:**
```json
{ "ok": false, "error": "managerId is required and must be a valid UUID" }
```
Causa: Parámetros inválidos

**403 Forbidden:**
```json
{ "ok": false, "error": "User is not an encargado" }
```
Causa: El `managerId` no tiene rol "encargado"

```json
{ "ok": false, "error": "Vendedor not assigned to this manager" }
```
Causa: El `vendedorId` no está asignado al encargado

**404 Not Found:**
```json
{ "ok": false, "error": "No vendedores assigned to this manager" }
```
Causa: El encargado no tiene vendedores asignados

**500 Internal Server Error:**
```json
{ "ok": false, "error": "Error message" }
```
Causa: Error de base de datos o del servidor

---

## Ejemplo Completo de Workflow n8n

**1. Webhook Node (Trigger):**
Recibe el payload del chat del encargado

**2. Set Node (Extraer Variables):**
```
managerId: {{$json.userId}}
vendedorId: {{$json.context.selectedVendedor}}
vendedorName: {{$json.context.selectedVendedorName}}
message: {{$json.message}}
```

**3. If Node (Clasificar Intención):**
- Si contiene "cierres", "facturación", "honorarios" → Rama A
- Si contiene "captaciones", "cartera", "propiedades" → Rama B
- Si contiene "trackeo", "llamadas", "visitas" → Rama C
- Si contiene "objetivo", "meta", "cumplimiento" → Rama D
- Si contiene "resumen", "equipo", "dashboard" → Rama E

**4. HTTP Request Node (Rama A - Cierres):**
```
POST https://tu-dominio.vercel.app/api/agent/manager/cierres
Headers: x-agent-secret: {{$env.AGENT_SECRET}}
Body:
{
  "managerId": "{{$node["Set"].json["managerId"]}}",
  "vendedorId": "{{$node["Set"].json["vendedorId"]}}",
  "mes": 6,
  "anio": 2025
}
```

**5. OpenAI Node (Generar Respuesta):**
```
Prompt: 
"Eres un asistente de un encargado de vendedores inmobiliarios.
El encargado preguntó: {{$node["Set"].json["message"]}}

Datos obtenidos: {{$json.data}}

Genera una respuesta clara y concisa en español."
```

**6. Respond to Webhook:**
```json
{
  "output": "{{$json.choices[0].message.content}}"
}
```

---

## Variables de Entorno Requeridas

```
AGENT_SECRET=tu_secret_compartido_con_n8n
N8N_MANAGER_WEBHOOK_URL=https://tu-n8n.com/webhook/manager-chat
N8N_CHAT_SECRET=tu_secret_para_validar_requests_desde_crm
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
```

---

## Tips de Implementación

1. **Cachea los vendedorIds:** El payload del webhook ya incluye `context.vendedorIds`, úsalo para validaciones rápidas sin llamar al endpoint `/vendedores`.

2. **Usa el `selectedVendedor` del context:** Siempre pasa `context.selectedVendedor` como `vendedorId` en tus requests para respetar el filtro del encargado.

3. **Maneja `null` en `selectedVendedor`:** Si es `null`, la API retorna datos de TODOS los vendedores asignados (equipo completo).

4. **Combina endpoints:** Para preguntas complejas como "¿Cómo va el cumplimiento de Sebastian?", llama a `/resumen` una sola vez en lugar de múltiples endpoints.

5. **Extrae fechas del mensaje:** Usa regex o un LLM para detectar "este mes", "junio", "último trimestre" y construir los filtros `mes`/`anio`/`desde`/`hasta` dinámicamente.

6. **Personaliza respuestas:** Si `context.selectedVendedorName` está presente, usa el nombre en la respuesta: "Sebastian tuvo 8 cierres" en lugar de "El vendedor tuvo 8 cierres".
