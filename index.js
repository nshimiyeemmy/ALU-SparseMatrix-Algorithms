const fs = require("fs");
const readline = require("readline");

/**
 * Represents a sparse matrix.
 */
class SparseMatrix {
  /**
   * Creates an instance of SparseMatrix.
   * @param {number} numRows - Number of rows in the matrix.
   * @param {number} numCols - Number of columns in the matrix.
   */
  constructor(numRows, numCols) {
    this.elements = new Map(); // To store non-zero elements
    this.rows = numRows; // Total number of rows
    this.cols = numCols; // Total number of columns
  }

  /**
   * Static method to create a SparseMatrix from a file path.
   * @param {string} matrixFilePath - Path to the matrix file.
   * @returns {SparseMatrix} A new SparseMatrix instance.
   */
  static fromFile(matrixFilePath) {
    try {
      const fileContent = fs.readFileSync(matrixFilePath, "utf8");
      const lines = fileContent.trim().split("\n");

      // Check if the file contains enough lines for matrix dimensions
      if (lines.length < 2) {
        throw new Error(
          `File ${matrixFilePath} does not contain enough lines for matrix dimensions`
        );
      }

      // Parse dimensions
      const rowMatch = lines[0].trim().match(/rows=(\d+)/);
      const colMatch = lines[1].trim().match(/cols=(\d+)/);

      // Validate dimension format
      if (!rowMatch || !colMatch) {
        throw new Error(
          `Invalid dimension format in file ${matrixFilePath}. Expected 'rows=X' and 'cols=Y'`
        );
      }

      const totalRows = parseInt(rowMatch[1]);
      const totalCols = parseInt(colMatch[1]);

      // Validate that the parsed dimensions are numbers
      if (isNaN(totalRows) || isNaN(totalCols)) {
        throw new Error(
          `Invalid matrix dimensions: rows=${rowMatch[1]}, cols=${colMatch[1]}. Numbers expected.`
        );
      }

      const sparseMatrix = new SparseMatrix(totalRows, totalCols);

      // Parse elements
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue; // Skip empty lines

        const match = line.match(/\((\d+),\s*(\d+),\s*(-?\d+)\)/);
        if (!match) {
          throw new Error(
            `Invalid format at line ${i + 1} in file ${matrixFilePath}: ${line}`
          );
        }

        const row = parseInt(match[1]);
        const col = parseInt(match[2]);
        const value = parseInt(match[3]);

        sparseMatrix.setElement(row, col, value);
      }

      return sparseMatrix;
    } catch (error) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${matrixFilePath}`);
      }
      throw error;
    }
  }

  /**
   * Retrieves the value of an element at a specific row and column.
   * @param {number} row - The row index of the element.
   * @param {number} col - The column index of the element.
   * @returns {number} The value at the specified position, or 0 if not set.
   */
  getElement(row, col) {
    const key = `${row},${col}`;
    return this.elements.get(key) || 0; // Return the value or 0 if not found
  }

  /**
   * Sets the value of an element at a specific row and column.
   * @param {number} row - The row index where the value should be set.
   * @param {number} col - The column index where the value should be set.
   * @param {number} value - The value to set at the specified position.
   */
  setElement(row, col, value) {
    if (row >= this.rows) this.rows = row + 1; // Update rows if needed
    if (col >= this.cols) this.cols = col + 1; // Update columns if needed

    const key = `${row},${col}`;
    this.elements.set(key, value); // Set the value in the map
  }

  /**
   * Adds another SparseMatrix to the current matrix.
   * @param {SparseMatrix} other - The matrix to add.
   * @returns {SparseMatrix} The resulting matrix after addition.
   */
  add(other) {
    const maxRows = Math.max(this.rows, other.rows);
    const maxCols = Math.max(this.cols, other.cols);
    const resultMatrix = new SparseMatrix(maxRows, maxCols);

    // Check if dimensions are compatible
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(
        `Matrix dimensions do not match for addition. First matrix is ${this.rows}x${this.cols} and second matrix is ${other.rows}x${other.cols}`
      );
    }

    // Add all elements from this matrix
    for (const [key, value] of this.elements) {
      const [row, col] = key.split(",").map(Number);
      resultMatrix.setElement(row, col, value);
    }

    // Add all elements from the other matrix
    for (const [key, value] of other.elements) {
      const [row, col] = key.split(",").map(Number);
      const currentValue = resultMatrix.getElement(row, col);
      resultMatrix.setElement(row, col, currentValue + value);
    }

    return resultMatrix; // Return the resulting matrix
  }

  /**
   * Subtracts another SparseMatrix from the current matrix.
   * @param {SparseMatrix} other - The matrix to subtract.
   * @returns {SparseMatrix} The resulting matrix after subtraction.
   */
  subtract(other) {
    const maxRows = Math.max(this.rows, other.rows);
    const maxCols = Math.max(this.cols, other.cols);
    const resultMatrix = new SparseMatrix(maxRows, maxCols);

    // Check if dimensions are compatible
    if (this.rows !== other.rows || this.cols !== other.cols) {
      throw new Error(
        `Matrix dimensions do not match for subtraction. First matrix is ${this.rows}x${this.cols} and second matrix is ${other.rows}x${other.cols}`
      );
    }

    // Add all elements from this matrix
    for (const [key, value] of this.elements) {
      const [row, col] = key.split(",").map(Number);
      resultMatrix.setElement(row, col, value);
    }

    // Subtract all elements from the other matrix
    for (const [key, value] of other.elements) {
      const [row, col] = key.split(",").map(Number);
      const currentValue = resultMatrix.getElement(row, col);
      resultMatrix.setElement(row, col, currentValue - value);
    }

    return resultMatrix; // Return the resulting matrix
  }

  /**
   * Multiplies the current SparseMatrix by another SparseMatrix.
   * @param {SparseMatrix} other - The matrix to multiply.
   * @returns {SparseMatrix} The resulting matrix after multiplication.
   */
  multiply(other) {
    // Check if multiplication dimensions are valid
    if (this.cols !== other.rows) {
      throw new Error(
        `Invalid dimensions for multiplication. First matrix columns (${this.cols}) must match second matrix rows (${other.rows})`
      );
    }

    const resultMatrix = new SparseMatrix(this.rows, other.cols);

    // Perform multiplication
    for (const [key1, value1] of this.elements) {
      const [row1, col1] = key1.split(",").map(Number);

      for (const [key2, value2] of other.elements) {
        const [row2, col2] = key2.split(",").map(Number);

        if (col1 === row2) {
          const currentValue = resultMatrix.getElement(row1, col2);
          resultMatrix.setElement(row1, col2, currentValue + value1 * value2);
        }
      }
    }

    return resultMatrix; // Return the resulting matrix
  }

  /**
   * Converts the SparseMatrix to a string representation.
   * @returns {string} The string representation of the SparseMatrix.
   */
  toString() {
    let result = `rows=${this.rows}\ncols=${this.cols}\n`;
    for (const [key, value] of this.elements) {
      const [row, col] = key.split(",");
      result += `(${row}, ${col}, ${value})\n`;
    }
    return result.trim(); // Return trimmed string
  }

  /**
   * Saves the SparseMatrix to a file.
   * @param {string} filePath - The path to save the matrix file.
   */
  saveToFile(filePath) {
    const content = this.toString(); // Get string representation
    fs.writeFileSync(filePath, content); // Write to file
  }
}

/**
 * Performs a matrix operation based on user input.
 */
async function performMatrixOperation() {
  try {
    // Define available operations
    const matrixOperations = {
      i: { name: "addition", method: "add" },
      ii: { name: "subtraction", method: "subtract" },
      iii: { name: "multiplication", method: "multiply" },
    };

    // Prompt user for the first matrix file path
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const matrixFilePath1 = await new Promise((resolve) => {
      rl.question("Enter the file path for the first matrix: ", (input) => {
        resolve(input);
      });
    });

    // Create the first SparseMatrix
    const matrix1 = SparseMatrix.fromFile(matrixFilePath1);
    console.log("First matrix loaded........\n");

    // Prompt user for the second matrix file path
    const matrixFilePath2 = await new Promise((resolve) => {
      rl.question("Enter the file path for the second matrix: ", (input) => {
        resolve(input);
      });
    });

    // Create the second SparseMatrix
    const matrix2 = SparseMatrix.fromFile(matrixFilePath2);
    console.log("Second matrix loaded........\n");

    // Prompt user for the operation choice
    const operationChoice = await new Promise((resolve) => {
      rl.question(
        "Choose an operation (i - addition, ii - subtraction, iii - multiplication): ",
        (input) => {
          resolve(input);
        }
      );
    });

    // Check if the operation choice is valid
    const operation = matrixOperations[operationChoice];
    if (!operation) {
      throw new Error("Invalid operation choice.");
    }

    // Perform the selected operation
    const resultMatrix = matrix1[operation.method](matrix2);
    console.log(`Result of ${operation.name}........\n`);

    // Ask user for the output file path
    const outputFilePath = await new Promise((resolve) => {
      rl.question("Enter the file path to save the result: ", (input) => {
        resolve(input);
      });
    });

    // Save the result matrix to the specified file
    resultMatrix.saveToFile(outputFilePath);
    console.log(`Result saved to ${outputFilePath}`);

    rl.close(); // Close the readline interface
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the matrix operation function
performMatrixOperation();
