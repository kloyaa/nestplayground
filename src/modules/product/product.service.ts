import { BloomFilterService } from '@app/core/services/search/bloom-filter.service';
import { Product } from '@app/database/entities/product.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private productRepository: Repository<Product>,
        private bloomFilterService: BloomFilterService,
    ) { }

    async findByName(name: string): Promise<Product[]> {
        // First check the Bloom filter - if it returns false, we know for sure
        // that the name doesn't exist in our database
        if (!this.bloomFilterService.mightContainName(name)) {
            console.log(`Quick return: '${name}' definitely doesn't exist (Bloom filter)`);
            return [];
        }

        // If the Bloom filter says it might exist, we need to query the database
        console.log(`Bloom filter suggests '${name}' might exist, querying database`);
        return this.productRepository.find({
            where: {
                name: name,
                isAvailable: true,
            },
        });
    }

    async searchByCategory(category: string): Promise<Product[]> {
        // Check if the category might exist
        if (!this.bloomFilterService.mightContainCategory(category)) {
            console.log(`Quick return: category '${category}' definitely doesn't exist (Bloom filter)`);
            return [];
        }

        console.log(`Bloom filter suggests category '${category}' might exist, querying database`);
        return this.productRepository.find({
            where: {
                category: category,
                isAvailable: true,
            },
        });
    }

    async createProduct(productData: Partial<Product>): Promise<Product> {
        const product = this.productRepository.create(productData);
        const savedProduct = await this.productRepository.save(product);

        // Update Bloom filters
        this.bloomFilterService.addProduct(savedProduct);

        return savedProduct;
    }
}