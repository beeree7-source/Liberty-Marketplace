import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

class Inventory extends Model {
  public id!: number;
  public retailerId!: number;
  public product!: string;
  public sku!: string;
  public quantity!: number;
  public minThreshold!: number;  // Auto-reorder trigger
  public supplierId?: number;
}

Inventory.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  retailerId: DataTypes.INTEGER,
  product: DataTypes.STRING,
  sku: DataTypes.STRING,
  quantity: DataTypes.INTEGER,
  minThreshold: DataTypes.INTEGER,  // When quantity < this, auto-order
  supplierId: DataTypes.INTEGER
}, { sequelize, modelName: 'Inventory' });

export default Inventory;
