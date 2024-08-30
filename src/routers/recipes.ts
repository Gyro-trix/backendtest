import { Router } from 'express'
import * as RecipesController from '../controllers/recipes'

const router = Router()

router.put('/', RecipesController.createRecipe)
router.get('/', RecipesController.getRecipes)
router.post('/', RecipesController.updateRecipe)
router.delete('/', RecipesController.deleteRecipe)

export default router