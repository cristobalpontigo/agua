# 🏗️ AGUAS PRO - NUEVA ARQUITECTURA v2.0

## 📊 CAMBIOS REALIZADOS

### ✅ Estructura Profesional

```
proyecto/
├── app/
│   ├── features/
│   │   ├── sales/          # Feature de Ventas
│   │   │   ├── EnhancedSaleForm.tsx
│   │   │   └── EnhancedSalesList.tsx
│   │   ├── payments/       # Feature de Pagos
│   │   └── clients/        # Feature de Clientes
│   ├── page.tsx            # Página principal (REFACTORIZADA)
│   └── layout.tsx
├── context/                # Estado Global
│   ├── AppContext.tsx
│   └── ToastContext.tsx
├── lib/
│   ├── types/
│   │   └── index.ts        # Tipos definidos (SIN DUPLICACIÓN)
│   ├── services/
│   │   └── sale.service.ts # Lógica de negocios reutilizable
│   ├── hooks/
│   │   └── useData.ts      # Hooks personalizados
│   ├── validation/
│   │   └── schemas.ts      # Validaciones con Zod
│   └── storage/
│       └── localStorage.ts # Persistencia
├── components/
│   ├── ui/
│   │   └── FormComponents.tsx  # Botones, Inputs reutilizables
│   └── (otros componentes)
└── ...
```

### 💡 BENEFICIOS DE LA NUEVA ARQUITECTURA

#### 1. **Estado Global Centralizado**
```typescript
// ❌ ANTES: Prop drilling
<Home sales={sales} setSales={setSales}>
  <SaleForm sales={sales} setSales={setSales} />
  <SalesList sales={sales} setSales={setSales} />
</Home>

// ✅ AHORA: Context API
const { sales, addSale } = useAppContext();
```

#### 2. **Servicios Reutilizables**
```typescript
// Un solo lugar para lógica de negocios
SaleService.calculateTotal(items);
SaleService.calculatePaidAmount(payments);
SaleService.generateSummary(items);
SaleService.getStats(sales, payments);
```

#### 3. **Datos Sin Duplicación**
```typescript
// ❌ ANTES: Redundancia
Sale {
  clientId: string;
  clientName: string;  // ¡Redundante!
  paidAmount?: number; // ¡Calculable!
  pendingAmount?: number; // ¡Calculable!
}

// ✅ AHORA: Solo lo necesario
Sale {
  clientId: string;  // Referencia única
  items: SaleLineItem[];
  payments: Payment[];
  // Valores calculados cuando se necesitan
}
```

#### 4. **Validaciones Centralizadas**
```typescript
// Zod schema
const SaleSchema = z.object({
  clientId: z.string().min(1),
  items: z.array(SaleLineItemSchema).min(1),
  sector: z.enum(Object.keys(SECTORS) as any),
});

// Usar en cualquier lugar
const validation = await validateSchema(SaleSchema, data);
```

#### 5. **Persistencia Automática con localStorage**
```typescript
// Datos encriptados en localStorage
StorageService.setSales(sales);
StorageService.getSales(); // Recuperar automáticamente
// Las ventas NO se pierden al refrescar ✓
```

#### 6. **Componentes Reutilizables**
```typescript
// Componentes sin estilos duplicados
<Input label="Cliente" error={errors.client} />
<Select label="Sector" options={sectors} />
<Button variant="primary" size="lg">Guardar</Button>
<Card>Contenido</Card>
<Badge variant="success">Completada</Badge>
```

#### 7. **Notificaciones (Toast)**
```typescript
const { addToast } = useToast();
addToast('¡Venta guardada!', 'success');
addToast('Error al guardar', 'error');
// Notificaciones automáticas sin reinventar la rueda
```

### 🚀 FLUJO DE DATOS MEJORADO

```
Usuario escribe en Formulario
    ↓
Validación con Zod
    ↓
Llamada a useAppContext
    ↓
AppContext actualiza estado
    ↓
StorageService guarda en localStorage
    ↓
Componentes se actualizan automáticamente
    ↓
Toast notifica al usuario
```

### 📝 COMPARACIÓN ANTES vs DESPUÉS

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Gestión de Estado** | useState (prop drilling) | Context API |
| **Persistencia** | React state (se pierde) | localStorage (persiste) |
| **Validación** | if statements | Zod schema completo |
| **Componentes** | Duplicados (Input, Button) | Reutilizables |
| **Lógica de negocios** | En componentes | En servicios |
| **Duplicación de datos** | clientName + clientId | Solo clientId |
| **Notificaciones** | alert() | Toast profesional |
| **Mantenibilidad** | Difícil | Excelente |
| **Escalabilidad** | Limitada | Excelente |

## 🎯 CÓMO USAR LA NUEVA ARQUITECTURA

### Crear una Venta
```typescript
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { SaleService, IdGeneratorService } from '@/lib/services/sale.service';

export function MyComponent() {
  const { addSale } = useAppContext();
  const { addToast } = useToast();

  const handleCreate = () => {
    const sale: Sale = {
      id: IdGeneratorService.sale(),
      clientId: 'client-1',
      sector: 'vizcachas',
      items: [/* ... */],
      status: 'pendiente',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    addSale(sale);
    addToast('Venta creada', 'success');
  };
}
```

### Acceder a Datos
```typescript
const { sales, payments } = useAppContext();

// Calcular estadísticas
const stats = SaleService.getStats(sales, payments);
console.log(stats.totalPaid); // Ingresos totales pagados
```

### Validar Datos
```typescript
import { validateSchema, SaleSchema } from '@/lib/validation/schemas';

const result = await validateSchema(SaleSchema, formData);
if (result.valid) {
  // Guardar
  addSale(result.data);
} else {
  addToast(result.error, 'error');
}
```

## 🔄 MIGRANDO COMPONENTES ANTIGUOS

Si quieres migrar un componente antiguo:

1. **Reemplazar useState**
   ```typescript
   // Viejo
   const [sales, setSales] = useState([]);
   
   // Nuevo
   const { sales } = useAppContext();
   ```

2. **Usar servicios**
   ```typescript
   // Viejo
   const total = items.reduce((sum, i) => sum + i.subtotal, 0);
   
   // Nuevo
   const total = SaleService.calculateTotal(items);
   ```

3. **Usar notificaciones**
   ```typescript
   // Viejo
   alert('Guardado');
   
   // Nuevo
   const { addToast } = useToast();
   addToast('Guardado', 'success');
   ```

## 📦 PRÓXIMOS PASOS RECOMENDADOS

1. **Conectar API Backend** - Reemplazar StorageService con llamadas HTTP
2. **Agregar Autenticación** - JWT tokens
3. **React Query** - Para cacheo de datos automático
4. **Tests Unitarios** - Para servicios
5. **Más Features** - Recurrentes, reportes avanzados, análisis

## ✨ PUNTOS CLAVES

✅ **Datos centralizados** - Un solo lugar de verdad
✅ **Sin duplicación** - Mejor rendimiento y mantenibilidad
✅ **Escalable** - Fácil de nuevas features
✅ **Tipo-seguro** - TypeScript completo
✅ **Persistencia** - Datos disponibles tras refresh
✅ **UX mejorada** - Notificaciones, validaciones, carga
✅ **Mantenible** - Código limpio y organizado
