import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from '@app/database/entities/product.entity';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get('search/name')
  async searchByName(@Query('name') name: string): Promise<Product[]> {
    return this.productService.findByName(name);
  }

  @Get('search/category')
  async searchByCategory(@Query('category') category: string): Promise<Product[]> {
    return this.productService.searchByCategory(category);
  }

  @Post()
  async createProduct(@Body() productData: Partial<Product>): Promise<Product> {
    return this.productService.createProduct(productData);
  }
}